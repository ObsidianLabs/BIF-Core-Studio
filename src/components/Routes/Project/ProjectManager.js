import notification from '@obsidians/notification'
import fileOps from '@obsidians/file-ops'
import { ProjectManager } from '@obsidians/project'
import { t } from '@obsidians/i18n'

function makeProjectManager(Base) {
	return class ProjectManager extends Base {
		async readProjectAbis() {
			const projectAbis = await super.readProjectAbis()
			if (this.projectSettings?.settings?.language === 'cpp') {
				return projectAbis.map(item => ({
					...item,
					abi: item.content,
				}))
			}
			return projectAbis
		}

		async getDefaultContractFileNode() {
			const settings = await this.checkSettings()
			console.log(settings)
			if (!settings?.deploy) {
				return
			}

			const filePath = this.pathForProjectFile(settings.deploy)
			const pathInProject = this.pathInProject(filePath)

			return { path: filePath, pathInProject }
		}

		async deploy(contractFileNode) {
			contractFileNode = contractFileNode || await this.getDefaultContractFileNode()
			console.log(contractFileNode)

			if (contractFileNode?.path?.endsWith('.wasm')) {
				const settings = await this.checkSettings()
				const abiPath = contractFileNode.path.replace('.wasm', '.abi')
				let base64Content
				try {
					const base64FilePath = contractFileNode.path.replace(settings.deploy, 'output.bin')
					base64Content = await fileOps.current.readFile(base64FilePath)
				} catch (e) {
					notification.error(t('contract.deploy.fail'), e.message)
					return
				}

				this.deployButton.getDeploymentParameters({
					contractFileNode: {
						path: abiPath,
						pathInProject: contractFileNode.pathInProject,
					},
					contracts: [{
						path: abiPath,
						pathInProject: contractFileNode.pathInProject,
					}],
				},
					(abi, allParameters) => this.pushDeployment(this.buildJSContractObj(allParameters.contractName, null, sourceCode), allParameters),
					(abi, allParameters) => this.estimate(this.buildJSContractObj(allParameters.contractName, null, sourceCode), allParameters)
				)

			} else if (contractFileNode?.path?.endsWith('.js')) {
				const abiPath = contractFileNode.path
				let sourceCode
				try {
					sourceCode = await fileOps.current.readFile(contractFileNode.path)
				} catch (e) {
					notification.error(t('contract.deploy.fail'), e.message)
					return
				}

				this.deployButton.getDeploymentParameters({
					contractFileNode: {
						path: abiPath,
						pathInProject: contractFileNode.pathInProject,
					},
					contracts: [{
						path: abiPath,
						pathInProject: contractFileNode.pathInProject,
					}],
				},
					(abi, allParameters) => this.pushDeployment(this.buildJSContractObj(allParameters.contractName, null, sourceCode), allParameters),
					(abi, allParameters) => this.estimate(this.buildJSContractObj(allParameters.contractName, null, sourceCode), allParameters)
				)

			} else {
				// solidity contract
				const abiPath = contractFileNode.path
				const abiName = fileOps.current.path.parse(abiPath).base
				let bytecode
				try {
					bytecode = await fileOps.current.readFile(contractFileNode.path.replace('_meta.json', '.bin'))
				} catch (e) {
					notification.error(t('contract.deploy.fail'), e.message)
					return
				}

				this.deployButton.getDeploymentParameters({
					contractFileNode: {
						path: abiPath,
						pathInProject: contractFileNode.pathInProject,
					},
					contracts: [{
						path: abiPath,
						pathInProject: contractFileNode.pathInProject,
					}],
					getConstructorAbiArgs: contractObj => {
						return contractObj.output.abi
					}
				},
					(abi, allParameters) => this.pushDeployment(this.buildContractObj(allParameters.contractName, abi, bytecode), allParameters),
					(abi, allParameters) => this.estimate(this.buildContractObj(allParameters.contractName, abi, bytecode), allParameters)
				)
			}

		}

		buildCppContractObj(contractName, abi, bytecode, base64Content) {
			return {
				contractName,
				abi,
				bytecode: base64Content,
				payload: base64Content,
				validateDeployment: 3,
			}
		}

		buildJSContractObj(contractName, abi, bytecode) {
			return {
				contractName,
				abi,
				bytecode,
				vmType: 0,
			}
		}

		buildContractObj(contractName, abi, bytecode) {
			return {
				contractName,
				abi,
				bytecode,
				vmType: 1,
			}
		}

		validateDeployment(contractObj) {

			if (contractObj.vmType === 1) {
				return {
					abi: contractObj.abi,
					bytecode: contractObj.bytecode,
					deployedBytecode: `0x${contractObj.bytecode}`,
					options: { vmType: contractObj.vmType, contractName: contractObj.contractName }
				}
			} else if (contractObj.vmType === 0) {
				return {
					abi: contractObj.abi,
					bytecode: contractObj.bytecode,
					deployedBytecode: `0x${contractObj.bytecode}`,
					options: { vmType: contractObj.vmType }
					// add contract name
				}
			} else {
				return super.validateDeployment(contractObj)
			}
		}
	}
}

export default {
	Local: makeProjectManager(ProjectManager.Local),
	Remote: makeProjectManager(ProjectManager.Remote),
}