import Network, { RemoteNetwork, CustomNetwork } from '@obsidians/network'

import RemoteNetworkInfo from './RemoteNetworkInfo'


RemoteNetwork.defaultProps = { RemoteNetworkInfo }
CustomNetwork.defaultProps = { placeholder: 'e.g. http://127.0.0.1:12537' }

Network.defaultProps = {
  configButton: true,
  minerKey: true,
}

export default Network