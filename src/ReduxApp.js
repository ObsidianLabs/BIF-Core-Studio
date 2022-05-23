import React, { Component, Suspense, lazy } from 'react'

import fileOps from '@obsidians/file-ops'
import Auth from '@obsidians/auth'
import { NotificationSystem } from '@obsidians/notification'
import Welcome, { checkDependencies } from '@obsidians/welcome'
import { GlobalModals, autoUpdater } from '@obsidians/global'
import { LoadingScreen } from '@obsidians/ui-components'
import redux, { Provider } from '@obsidians/redux'
import compiler from '@obsidians/compiler'
import { config, updateStore } from '@/redux'
import '@/menu'

import Routes from './components/Routes'
import icon from './components/icon.png'
const Header = lazy(() => import('./components/Header' /* webpackChunkName: "header" */))

const overrideItems = [
  {
    channel: compiler.bif,
    title: `${process.env.COMPILER_NAME} in Docker`,
    subtitle: `${process.env.CHAIN_NAME} version of compiler to compile a project.`,
    link: `https://hub.docker.com/r/${process.env.DOCKER_IMAGE_COMPILER}`,
    downloadingTitle: `Downloading ${process.env.COMPILER_NAME}`,
  },
  {
    channel: compiler.cdt,
    title: 'BIF-WASM-CDT',
    subtitle: '将 C++ 合约文件编译成对应的 wasm 和 abi 文件',
    link: `https://hub.docker.com/r/${process.env.DOCKER_IMAGE_COMPILER}`,
    downloadingTitle: `Downloading BIF-WASM-CDT`,
  },
  {
    channel: compiler.abi,
    title: 'BIF-WASM-ABI',
    subtitle: '将生成的对应 abi 文件编码成 abicode',
    link: `https://hub.docker.com/r/${process.env.DOCKER_IMAGE_COMPILER}`,
    downloadingTitle: `Downloading BIF-WASM-ABI`,
  }
]

Welcome.defaultProps = {
  hasNode: false,
  overrideItems
}
export default class ReduxApp extends Component {
  state = {
    loaded: false,
    dependencies: false
  }

  async componentDidMount() {
    await redux.init(config, updateStore).then(onReduxLoaded)
    this.refresh()
  }

  componentDidUpdate(prevProps) {
    console.log(prevProps)
  }

  refresh = async () => {
    const dependencies = await checkDependencies(overrideItems)
    console.log(dependencies, 'refresh')
    this.setState({ loaded: true, dependencies })
    // autoUpdater.check()
  }

  skip = () => {
    this.setState({ loaded: true, dependencies: true })
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingScreen />
    }

    if (!this.state.dependencies) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <Welcome
            isReady={checkDependencies}
            onGetStarted={this.skip}
            truffleSubtitle={`The library used to create and compile a project.`}
          />
          <NotificationSystem />
          <GlobalModals icon={icon} />
        </Suspense>
      )
    }
    return (
      <Provider store={redux.store}>
        <div
          className='body'
          style={{ paddingTop: this.state.dependencies ? '49px' : '0' }}
        >
          <Routes>
            <Header history={this.props.history} />
            <NotificationSystem />
            <GlobalModals icon={icon} />
          </Routes>
        </div>
      </Provider>
    )
  }
}

async function onReduxLoaded() {
  Auth.restore()
  const version = await fileOps.current.getAppVersion()
  redux.dispatch('SET_VERSION', { version })
}
