// components/CreateGroup/TransactionDetailsForm.tsx

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import {
  setItemDescription,
  setPrice,
  setServiceNature,
  nextStep,
  previousStep,
} from '@/lib/slices/groupCreationSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Typography from '@/components/ui/typography'

const TransactionDetailsForm = () => {
  const dispatch = useDispatch()
  const { itemDescription, price, serviceNature } = useSelector((state: RootState) => state.groupCreation)

  const handleNext = () => {
    if (!itemDescription.trim() || !price || !serviceNature.trim()) {
      alert('Please fill in all fields.')
      return
    }
    dispatch(nextStep())
  }

  return (
    <div>
      <Typography variant="h3" className="mb-4">
        Transaction Details
      </Typography>
      <div className="space-y-4">
        <div>
          <Typography variant="span" className="font-semibold">
            Item/Service Description
          </Typography>
          <Input
            type="text"
            placeholder="What are you buying or selling?"
            value={itemDescription}
            onChange={(e) => dispatch(setItemDescription(e.target.value))}
            className="mt-1"
          />
        </div>

        <div>
          <Typography variant="span" className="font-semibold">
            Price (USD)
          </Typography>
          <Input
            type="number"
            placeholder="Enter price (excluding Xcrow fee)"
            value={price}
            onChange={(e) => dispatch(setPrice(parseFloat(e.target.value)))}
            className="mt-1"
            min={0}
          />
        </div>

        <div>
          <Typography variant="span" className="font-semibold">
            Nature of the Service
          </Typography>
          <Input
            type="text"
            placeholder="Provide a brief description of the service"
            value={serviceNature}
            onChange={(e) => dispatch(setServiceNature(e.target.value))}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => dispatch(previousStep())}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

export default TransactionDetailsForm
