import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface GroupCreationState {
  step: number
  transactionType: "buying" | "selling" | null
  itemDescription: string
  price: number
  escrowFee: number
  serviceNature: string
  escrowFeeResponsibility: "buyer" | "seller" | "50/50" | null
  paymentSource: string
  chargeFeeFromBuyerPayment: boolean
  transactionId: string
  paymentMethod: string
  sellerSummaryDocId: string | null
  depositAmount: number
  currency: string
}

const initialState: GroupCreationState = {
  step: 1,
  transactionType: null,
  itemDescription: "",
  price: 0,
  escrowFee: 0,
  serviceNature: "",
  escrowFeeResponsibility: null,
  paymentSource: "",
  chargeFeeFromBuyerPayment: false,
  transactionId: "",
  paymentMethod: "",
  sellerSummaryDocId: null,
  depositAmount: 0,
  currency: "USD", // default
}

const groupCreationSlice = createSlice({
  name: "groupCreation",
  initialState,
  reducers: {
    setTransactionType(state, action: PayloadAction<"buying" | "selling">) {
      state.transactionType = action.payload
    },
    setItemDescription(state, action: PayloadAction<string>) {
      state.itemDescription = action.payload
    },
    setPrice(state, action: PayloadAction<number>) {
      state.price = action.payload
    },
    setEscrowFee(state, action: PayloadAction<number>) {
      state.escrowFee = action.payload
    },
    setServiceNature(state, action: PayloadAction<string>) {
      state.serviceNature = action.payload
    },
    setEscrowFeeResponsibility(
      state,
      action: PayloadAction<"buyer" | "seller" | "50/50">
    ) {
      state.escrowFeeResponsibility = action.payload
    },
    setPaymentSource(state, action: PayloadAction<string>) {
      state.paymentSource = action.payload
    },
    setChargeFeeFromBuyerPayment(state, action: PayloadAction<boolean>) {
      state.chargeFeeFromBuyerPayment = action.payload
    },
    setTransactionId(state, action: PayloadAction<string>) {
      state.transactionId = action.payload
    },
    setPaymentMethod(state, action: PayloadAction<string>) {
      state.paymentMethod = action.payload
    },
    setSellerSummaryDocId(state, action: PayloadAction<string | null>) {
      state.sellerSummaryDocId = action.payload
    },
    setCurrency(state, action: PayloadAction<string>) {
      state.currency = action.payload
    },
    setDepositAmount(state, action: PayloadAction<number>) {
      state.depositAmount = action.payload
    },
    nextStep(state) {
      if (state.step < 4) {
        state.step += 1
      }
    },
    previousStep(state) {
      if (state.step > 1) {
        state.step -= 1
      }
    },
    resetGroupCreation(state) {
      Object.assign(state, initialState)
    },
  },
})

export const {
  setTransactionType,
  setItemDescription,
  setPrice,
  setEscrowFee,
  setServiceNature,
  setEscrowFeeResponsibility,
  setPaymentSource,
  setChargeFeeFromBuyerPayment,
  setTransactionId,
  setPaymentMethod,
  setSellerSummaryDocId,
  setCurrency,
  setDepositAmount,
  nextStep,
  previousStep,
  resetGroupCreation,
} = groupCreationSlice.actions

export default groupCreationSlice.reducer
