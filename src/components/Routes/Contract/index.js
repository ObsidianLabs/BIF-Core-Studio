import Contract from '@obsidians/contract'
import ContractPage from './ContractPage'

Contract.defaultProps = {
  ...Contract.defaultProps,
  Page: ContractPage,
  valueFormatter: value => value,
}

export default Contract