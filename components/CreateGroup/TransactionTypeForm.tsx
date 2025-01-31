import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import { setTransactionType, nextStep } from '@/lib/slices/groupCreationSlice'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Typography from '@/components/ui/typography'

const TransactionTypeForm = () => {
  const dispatch = useDispatch()
  const transactionType = useSelector((state: RootState) => state.groupCreation.transactionType)

  const transactionTypes = [
    { value: 'buying', label: 'Buying' },
    { value: 'selling', label: 'Selling' }
  ]

  const handleNext = () => {
    if (transactionType) {
      dispatch(nextStep())
    } else {
      alert('Please select a transaction type.')
    }
  }

  return (
    <div>
      <Typography variant="h3" className="mb-4">
        Select Transaction Type
      </Typography>
      <RadioGroup
        value={transactionType ?? ''}
        onValueChange={(value: 'buying' | 'selling') => dispatch(setTransactionType(value))}
        className="flex flex-col space-y-2"
      >
        {transactionTypes.map(({ value, label }) => (
          <div key={value} className="flex items-center space-x-2">
            <RadioGroupItem value={value} id={value} />
            <label htmlFor={value} className="cursor-pointer">
              {label}
            </label>
          </div>
        ))}
      </RadioGroup>

      <div className="flex justify-end mt-6">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

export default TransactionTypeForm