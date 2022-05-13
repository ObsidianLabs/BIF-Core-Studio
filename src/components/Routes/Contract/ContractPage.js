import redux from '@obsidians/redux'
import { ContractPage } from '@obsidians/contract'

export default class PlatonContractPage extends ContractPage {
	getAbiData (codeHash) {
		console.log(codeHash, 'codeHash')
    const abiData = redux.getState().abis.get(codeHash)?.toJS()
		console.log(abiData, 'abiData')
    if (!abiData) {
      return
    }
    try {
      abiData.abi = JSON.parse(abiData.abi==="{}"? "[]" : abiData.abi)
    } catch {
      throw new Error('Invalid ABI structure.')
    }
    return abiData
  }
}