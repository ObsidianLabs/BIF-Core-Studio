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
        const abiPath = contractFileNode.path.replace('.wasm', '.abi')
        // const abiName = fileOps.current.path.parse(abiPath).base
        let base64Content
        try {
          console.log(contractFileNode.path, 'contractFileNode.path')
          const base64Content = await fileOps.current.readFile(contractFileNode.path.replace('.wasm', '.bin'))
          console.log(base64Content)
          // const arr = Uint8Array.from(content)
          // arr.forEach(n => buffer.push(String.fromCharCode(n)))
          // const bin = buffer.join('')
          // console.log(content, 'bin')
        } catch (e) {
          notification.error('Deploy Error', e.message)
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
          (abi, allParameters) => this.pushDeployment(this.buildCppContractObj(allParameters.contractName, null, base64Content, base64Content), allParameters),
          (abi, allParameters) => this.estimate(this.buildCppContractObj(allParameters.contractName, null, base64Content, base64Content), allParameters)
        )

      } else if (contractFileNode?.path?.endsWith('.js')) {
        const abiPath = contractFileNode.path
        let sourceCode
        try {
          sourceCode = await fileOps.current.readFile(contractFileNode.path)
        } catch (e) {
          notification.error('Deploy Error', e.message)
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
          notification.error('Deploy Error', e.message)
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
          options: { vmType: contractObj.vmType }
        }
      } else if (contractObj.vmType === 0) {
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