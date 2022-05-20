import notification from '@obsidians/notification'
import fileOps from '@obsidians/file-ops'
import { ProjectManager } from '@obsidians/project'

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
      if (!settings?.deploy) {
        return
      }

      const filePath = this.pathForProjectFile(settings.deploy)
      const pathInProject = this.pathInProject(filePath)
      
			return { path: filePath, pathInProject }
    }

		async deploy(contractFileNode) {
			console.log(contractFileNode, 'contractFileNode')
			contractFileNode = contractFileNode || await this.getDefaultContractFileNode()
			console.log(contractFileNode)
			if (contractFileNode?.path?.endsWith('.wasm')) {
				const abiPath = contractFileNode.path.replace('.wasm', '.abi')
        const abiName = fileOps.current.path.parse(abiPath).base
				let bytecode
				try {
					bytecode = await fileOps.current.readFile(contractFileNode.path.replace('.json','.bin'))
					console.log(bytecode)
				} catch (e) {
					notification.error('Deploy Error', e.message)
					return
				}

			}
			// solidity contract
			const abiPath = contractFileNode.path
			const abiName = fileOps.current.path.parse(abiPath).base
			let bytecode
			try {
				bytecode = await fileOps.current.readFile(contractFileNode.path.replace('_meta.json','.bin'))
			} catch (e) {
				notification.error('Deploy Error', e.message)
				return
			}

			console.log(bytecode, 'bytecode')
			this.deployButton.getDeploymentParameters({
				contractFileNode: {
					path: abiPath,
					pathInProject: contractFileNode.pathInProject,
				},
				contracts: [{
					path:  abiPath,
					pathInProject: contractFileNode.pathInProject,
				}],
				getConstructorAbiArgs: contractObj => {
					return [
						contractObj.output.abi.map(item => {
							return {
								...item,
								inputs: item.input,
								type: item.type === 'Action' ? 'function' : '',
								stateMutability: item.constant ? 'view' : ''
							}
						}),
						{ key: 'name', value: 'init' }
					]
				}
			},
				(abi, allParameters) => this.pushDeployment(this.buildContractObj(allParameters.contractName, abi, bytecode), allParameters),
				(abi, allParameters) => this.estimate(this.buildContractObj(allParameters.contractName, abi, bytecode), allParameters)
			)
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
			if (contractObj.vmType) {
				return {
					abi: contractObj.abi,
					bytecode: contractObj.bytecode,
					deployedBytecode: `0x${contractObj.bytecode}`,
					options: { vmType: contractObj.vmType }
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