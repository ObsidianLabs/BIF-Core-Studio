import Contract from '@obsidians/contract'

Contract.defaultProps = {
	...Contract.defaultProps,
	valueFormatter: value => value,
}

export default Contract