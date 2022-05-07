import React, { PureComponent } from 'react'

import { connect } from '@obsidians/redux'

import headerActions, { Header, NavGuard } from '@obsidians/header'
import { networkManager } from '@obsidians/network'
import { actions } from '@obsidians/workspace'
import keypairManager, { KeypairInputSelector } from '@obsidians/keypair'

import { List } from 'immutable'
import ConfluxSdk from '@obsidians/bif-sdk'

const extraContractItems = [
  { header: 'internal contracts' },
  { id: '0x0888000000000000000000000000000000000000', name: 'AdminControl' },
  { id: '0x0888000000000000000000000000000000000001', name: 'SponsorWhitelistControl' },
  { id: '0x0888000000000000000000000000000000000002', name: 'Staking' },
  { divider: true },
]

const prefix = {
  tethys: 'cfx:',
  testnet: 'cfxtest:',
}

keypairManager.kp = ConfluxSdk.kp
networkManager.addSdk(ConfluxSdk, ConfluxSdk.networks)

class HeaderWithRedux extends PureComponent {
  state = {
    networkList: List(),
  }

  componentDidMount () {
    actions.history = this.props.history
    headerActions.history = this.props.history
    this.setState({ networkList: List(networkManager.networks) }, this.setNetwork)
    if (!networkManager.network) {
      networkManager.setNetwork(networkManager.networks[0], { notify: false })
    }
    this.navGuard = new NavGuard(this.props.history)
  }

  componentDidUpdate (props) {
    if (this.props.network !== props.network) {
      const network = this.props.network
      KeypairInputSelector.defaultProps = {
        // filter: k => k.address?.startsWith(prefix[network] || '0x')
      }
    }
  }

  groupedNetworks = networksByGroup => {
    const networkList = []
    const groups = networksByGroup.toJS()
    const keys = Object.keys(groups)
    keys.forEach((key, index) => {
      if (key !== 'default') {
        networkList.push({ header: key })
      }
      groups[key].forEach(network => networkList.push(network))
      if (index !== keys.length - 1) {
        networkList.push({ divider: true })
      }
    })
    return networkList
  }

  render () {
    console.debug('[render] HeaderWithRedux')
    const { uiState, profile, projects, contracts, accounts, network } = this.props

    const selectedProject = projects.get('selected')?.toJS() || {}

    const networkGroups = this.state.networkList.groupBy(n => n.group)
    const groupedNetworks = this.groupedNetworks(networkGroups)
    const selectedNetwork = this.state.networkList.find(n => n.id === network) || {}

    const browserAccounts = uiState.get('browserAccounts') || []
    const starred = accounts.getIn([network, 'accounts'])?.toJS() || []
    const starredContracts = contracts.getIn([network, 'starred'])?.toJS() || []
    const selectedContract = contracts.getIn([network, 'selected']) || ''
    const selectedAccount = accounts.getIn([network, 'selected']) || ''

    const keypairManagerFilter = k => k.id.startsWith(prefix[network] || '0x')

    return (
      <Header
        profile={profile}
        projects={projects}
        selectedProject={selectedProject}
        selectedContract={selectedContract}
        selectedAccount={selectedAccount}
        starred={starred}
        starredContracts={starredContracts}
        // keypairManagerFilter={keypairManagerFilter}
        browserAccounts={browserAccounts}
        extraContractItems={extraContractItems}
        network={selectedNetwork}
        networkList={groupedNetworks}
      />
    )
  }
}

export default connect([
  'uiState',
  'profile',
  'projects',
  'contracts',
  'accounts',
  'network',
])(HeaderWithRedux)