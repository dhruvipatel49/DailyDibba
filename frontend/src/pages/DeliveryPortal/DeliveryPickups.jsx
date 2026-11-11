import React from 'react'
import DeliveryBoard from './DeliveryBoard.jsx'

const DeliveryPickups = () => (
  <DeliveryBoard
    kind="pickup"
    title="Home Pickup Orders"
    emptyMessage="No active pickup orders assigned to you."
  />
)

export default DeliveryPickups
