import React, { PureComponent } from 'react'

import {
  TableCard,
  TableCardRow,
} from '@obsidians/ui-components'

export default class RemoteNetworkInfo extends PureComponent {
  render () {
    const { networkId, url, EditButton, status, info } = this.props
    return (
      <div className='d-flex'>
        <div className='col-6 p-0 border-right-black'>
          <TableCard
            title={`${process.env.CHAIN_NAME} Network (${networkId})`}
            right={EditButton}
          >
            <TableCardRow name='Node URL' badge={url} badgeColor='primary' />
          </TableCard>
        </div>
        <div className='col-6 p-0'>
          <TableCard title='Blocks'>
            <TableCardRow
              name='Block Number'
              badge={status?.header?.number}
            />
          </TableCard>
        </div>
      </div>
    )
  }
}