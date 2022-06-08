import Explorer, { TransferButton } from '@obsidians/explorer'

TransferButton.defaultProps = {
	addressLength: 50,
}

Explorer.defaultProps = {
	...Explorer.defaultProps,
	valueFormatter: value => value,
}

export default Explorer
