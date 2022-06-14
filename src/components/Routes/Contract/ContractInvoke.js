import React, { Component } from 'react'
import {
	UncontrolledButtonDropdown,
	DropdownToggle,
	DebouncedInput,
	Badge,
	ToolbarButton,
} from '@obsidians/ui-components'
import Highlight from 'react-highlight'
import notification from '@obsidians/notification'
import moment from 'moment'
import redux from '@obsidians/redux'
import { DropdownCard } from '@obsidians/contract'
import { KeypairInputSelector } from '@obsidians/keypair'

import Args from './Args'

export default class ContractActions extends Component {
	state = {
		method: 'transfer',
		executing: false,
		results: [],
	}

	args = React.createRef()

	renderResult = () => {
		const { actionError, actionResult } = this.state
		if (actionError) {
			return (
				<div>
					<span>{actionError}</span>
				</div>
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

	executeInvoke = async () => {
		const args = this.args.current.getArgs()
		const address = this.props.contract.address
		const abi = redux.getState().abis.getIn([address])?.toJS()
		console.log(args)
		const transformArgs = {}
		for(let i in args) {
			if(Number(args[i]).toString() === 'NaN') {
				transformArgs[i] = args[i]
			} else if(typeof Number(args[i]) === 'number') {
				transformArgs[i] = Number(args[i])
			}
		}
		console.log(transformArgs)
		if (abi.vmType === 3) {
			try {
				const res = await fetch('http://68.79.22.110:30001/wasmAbiEncode', {
					method: 'POST',
					mode: 'cors',
					body: JSON.stringify({
						abi: abi.abi,
						method: this.state.method,
						params: JSON.stringify(transformArgs)
					})
				})
				const { error_code, result, error_desc} = await res.json()

				if(!result) {
					notification.error('调用失败', error_desc)
					return
				}
	
				const abicode = result.abicode
				const invokeRes =  await this.props.contract.execute(
					this.state.method,
					{ json: {
						abicode,
						...args
					} },
					{
						ext: 'cpp',
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
		this.setState({ executing: true })
		try {
			const res = await this.props.contract.execute(
				this.state.method,
				{ json: args },
				{
					ext: 'js',
					from: this.state.signer
				}
			)
			this.setState({
				actionResult: res.raw
			})
		} catch (e) {
			console.warn(e)
			notification.error('调用失败', e.message)
			this.setState({ actionError: '' })
		}
		this.setState({ executing: false })
	}

	renderActionSelector = () => {
		return <>
			<UncontrolledButtonDropdown size='sm'>
				<DropdownToggle color='secondary' className='rounded-0 border-0 px-2 border-right-1'>
					<code className='mx-1'><b>调用</b></code>
				</DropdownToggle>
			</UncontrolledButtonDropdown>
			<ToolbarButton
				id='contract-execute-invoke'
				icon={this.state.executing ? 'fas fa-spin fa-spinner' : 'fas fa-play'}
				tooltip='Execute'
				className='border-right-1'
				onClick={this.executeInvoke}
			/>
		</>
	}

	renderTableBody = () => {
		return this.state.results.map((row, index) => {
			return (
				<tr key={`result-${index}`}>
					<td className='small'>{moment.unix(row.ts).format('MM/DD HH:mm:ss')}</td>
					<td className='small'>{row.signer}</td>
					<td><code className='small'>{row.query}</code></td>
					<td>
						<div className='small'>
							<div>区块：{row.result.block}</div>
							<div>哈希：<code className='break-all'>{row.result.hash}</code></div>
						</div>
					</td>
				</tr>
			)
		})
	}

	render() {
		const { signer, contract } = this.props

		return (
			<div className='d-flex flex-column align-items-stretch h-100 overflow-auto'>
				<div className='d-flex border-bottom-1'>
					{this.renderActionSelector()}
				</div>
				<DropdownCard isOpen title='方法名'>
					<DebouncedInput
						size='sm'
						placeholder='需要发起调用的方法名'
						value={this.state.method}
						onChange={method => this.setState({ method })}
					/>
				</DropdownCard>
				<DropdownCard isOpen title='参数'>
					<Args
						ref={this.args}
						initial={{ from: signer, to: '', token: '' }}
					/>
				</DropdownCard>
				<DropdownCard
					isOpen
					title='授权'
					overflow
				>
					<KeypairInputSelector
						size='sm'
						label='账户地址'
						value={this.state.signer}
						onChange={signer => this.setState({ signer })}
					/>
				</DropdownCard>
				<DropdownCard
					isOpen
					title='结果'
					overflow
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
