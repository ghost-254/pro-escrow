// components/CreateGroup/TransactionDetailsForm.tsx

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import {
  setItemDescription,
  setPrice,
  setServiceNature,
  setCurrency,
  nextStep,
  previousStep,
} from '@/lib/slices/groupCreationSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Typography from '@/components/ui/typography'

const TransactionDetailsForm = () => {
  const dispatch = useDispatch()
  const { itemDescription, price, serviceNature, currency } = useSelector(
    (state: RootState) => state.groupCreation
  )

  const handleNext = () => {
    if (!itemDescription.trim() || price === null || !serviceNature.trim() || !currency) {
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
        {/* Item/Service Description */}
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

        {/* Currency Selection */}
        <div>
          <Typography variant="span" className="font-semibold">
            Select Currency
          </Typography>
          <div className="flex items-center space-x-4 mt-1">
            <label className="flex items-center">
              <input
                type="radio"
                name="currency"
                value="USD"
                checked={currency === 'USD'}
                onChange={(e) => dispatch(setCurrency(e.target.value))}
              />
              <span className="ml-2">USD</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="currency"
                value="KES"
                checked={currency === 'KES'}
                onChange={(e) => dispatch(setCurrency(e.target.value))}
              />
              <span className="ml-2">KES</span>
            </label>
          </div>
          <Typography variant="p" className="text-gray-500">
            Please select USD if you wish to pay with Crypto and KES if you wish to pay with Mpesa.
          </Typography>
        </div>

        {/* Price Input */}
        <div>
          <Typography variant="span" className="font-semibold">
            Price ({currency})
          </Typography>
          <Input
            type="number"
            placeholder="Enter price (excluding Xcrow fee)"
            value={price || ''}
            onChange={(e) => dispatch(setPrice(parseFloat(e.target.value)))}
            className="mt-1"
            min={0}
          />
        </div>

        {/* Nature of the Service */}
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

      {/* Navigation Buttons */}
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
