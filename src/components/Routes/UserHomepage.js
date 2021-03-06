import { BaseUserHomepage, UserProfile } from '@obsidians/user'
import { connect } from '@obsidians/redux'
import { networkManager } from '@obsidians/network'
import platform from '@obsidians/platform'

BaseUserHomepage.defaultProps = {
  noUser: !platform.isWeb
}

UserProfile.defaultProps = {
  noUser: true
}

class Homepage extends BaseUserHomepage {
  componentDidMount (props) {
    super.componentDidMount(props)
    if (process.env.DEPLOY === 'bsn') {
      this.updateNetwork()
    }
  }

  async updateNetwork () {
    const urlParams = new URLSearchParams(this.props.location.search);
    const projectId = urlParams.get('projectId')
    if (!projectId) {
      return
    }
    const networkId = `bsn_${urlParams.get('projectId')}`
    // this.setNetwork(networkId)
  }

  async setNetwork (networkId, counter = 0) {
    if (networkManager?.networks?.length) {
      const network = networkManager.networks.find(network => network.id === networkId)
      if (network) {
        networkManager.setNetwork(network, { redirect: false, notify: true })
      }
      this.props.history.replace(`/${this.props.match.params.username}`)
    } else if (counter <= 30) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await this.setNetwork(networkId, ++counter)
    }
  }
}

export default connect(['profile', 'projects'])(Homepage)
