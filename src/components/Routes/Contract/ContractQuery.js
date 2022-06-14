import React, { Component } from 'react'
import {
  UncontrolledButtonDropdown,
  DropdownToggle,
  DebouncedInput,
  ToolbarButton,
  Badge,
} from '@obsidians/ui-components'
import moment from 'moment'
import Highlight from 'react-highlight'
import { DropdownCard } from '@obsidians/contract'
import { KeypairInputSelector } from '@obsidians/keypair'
import Args from './Args'
import redux from '@obsidians/redux'
import notification from '@obsidians/notification'

export default class ContractTable extends Component {
  state = {
    method: 'balance',
    executing: false,
    actionError: '',
    actionResult: '',
  }

  args = React.createRef()

  executeQuery = async () => {
    const args = this.args.current.getArgs()
    this.setState({ executing: true })
    const address = this.props.contract.address
    const abi = redux.getState().abis.getIn([address])?.toJS()

    if (abi.vmType === 3) {
      try {
        const res = await fetch('http://68.79.22.110:30001/wasmAbiEncode', {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify({
            abi: abi.abi,
            method: this.state.method,
            params: args
          })
        })
        const { error_code, result, error_desc} = await res.json()

				if(!result) {
					notification.error('调用失败', error_desc)
					return
				}
        const abicode = result.abicode
        const invokeRes = await this.props.contract.query(
          this.state.method,
          {
            json: {
              ...args
            }
          },
          {
            ext: 'js',
            abicode,
            from: this.state.signer
          }
        )
        this.setState({
          actionResult: invokeRes.raw
        })
        return
      } catch (e) {
        notification.error('调用失败', e.message)
        console.error(e)
        return
      }
    }
    try {
      const result = await this.props.contract.query(this.state.method, { json: args }, { from: this.state.signer, ext: 'js' })
      this.setState({
        executing: false,
        actionError: '',
        actionResult: result.raw,
      })
    } catch (e) {
      console.warn(e)
      this.setState({ executing: false, actionError: '', actionResult: '' })
    }
  }

  renderTableSelector = () => <>
    <UncontrolledButtonDropdown size='sm'>
      <DropdownToggle color='secondary' className='rounded-0 border-0 px-2 border-right-1'>
        <code className='mx-1'><b>Query</b></code>
      </DropdownToggle>
    </UncontrolledButtonDropdown>
    <ToolbarButton
      id='contract-execute-query'
      icon={this.state.executing ? 'fas fa-spin fa-spinner' : 'fas fa-play'}
      tooltip='Execute'
      className='border-right-1'
      onClick={this.executeQuery}
    />
  </>

  renderTableBody = () => {
    return this.state.results.map((row, index) => {
      return (
        <tr key={`result-${index}`}>
          <td className='small'>{moment.unix(row.ts).format('MM/DD HH:mm:ss')}</td>
          <td><code className='small break-all'>{row.args}</code></td>
          <td>
            {
              row.result
                ? <span className='text-success mr-1'><i className='fas fa-check-circle' /></span>
                : <span className='text-danger mr-1'><i className='fas fa-times-circle' /></span>
            }
            <span>{row.result?.toString()}</span>
          </td>
        </tr>
      )
    })
  }

  renderResult = () => {
    const { actionError, actionResult } = this.state
    if (actionError) {
      return (
        <Highlight language='javascript' className='pre-wrap break-all small' element='pre'>
          <code>{JSON.stringify(actionError, null, 2)}</code>
        </Highlight>
      )
    }

    if (actionResult) {
      return (
        <Highlight language='javascript' className='pre-wrap break-all small' element='pre'>
          <code>{JSON.stringify(actionResult, null, 2)}</code>
        </Highlight>
      )
    }

    return <div className='small'>(None)</div>
  }

  render() {
    const { signer } = this.props

    return (
      <div className='d-flex flex-column align-items-stretch h-100  overflow-auto'>
        <div className='d-flex border-bottom-1'>
          {this.renderTableSelector()}
        </div>
        <DropdownCard isOpen title='Method'>
          <DebouncedInput
            size='sm'
            placeholder='Name of the method'
            value={this.state.method}
            onChange={method => this.setState({ method })}
          />
        </DropdownCard>
        <DropdownCard
          isOpen
          title='Args'
          flex='0 1 auto'
        >
          <Args
            ref={this.args}
            initial={{ caller: signer }}
          />
        </DropdownCard>
        <DropdownCard
          isOpen
          title='Authorization'
          overflow
        >
          <KeypairInputSelector
            size='sm'
            label='Signer'
            value={this.state.signer}
            onChange={signer => this.setState({ signer })}
          />
        </DropdownCard>
        <DropdownCard
          isOpen
          title='Result'
          minHeight='120px'
          right={
            this.state.actionError
              ? <Badge color='danger'>Error</Badge>
              : this.state.actionResult ? <Badge color='success'>Success</Badge> : null
          }
        >
          {this.renderResult()}
        </DropdownCard>
      </div>
    )
  }
}