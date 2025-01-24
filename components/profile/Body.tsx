'use client'

import React, { useState, useEffect, FC } from 'react'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'

import { db, storage } from '@/lib/firebaseConfig'
import { RootState } from '@/lib/stores/store'
import { useToast } from '../../hooks/use-toast'

// UI & Components
import Typography from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Icons
import { SiBinance, SiPaypal } from 'react-icons/si'
import { FaMobileAlt } from 'react-icons/fa'
import { Copy, Check, Trash2, Plus } from 'lucide-react'

// Example small country code list
const COUNTRIES = [
  { name: 'Kenya', code: '+254' },
  { name: 'United States', code: '+1' },
  { name: 'Nigeria', code: '+234' },
  { name: 'United Kingdom', code: '+44' },
]

interface FormState {
  firstName: string
  lastName: string
  fullName: string
  email: string
  countryCode: string
  phoneNumber: string
  cryptoBEP20: string
  binanceId: string
  paypal: string
  mpesa: string
  photoURL?: string
}

const Body: FC = () => {
  const user = useSelector((state: RootState) => state.auth.user)
  const [formState, setFormState] = useState<FormState>({
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    countryCode: '',
    phoneNumber: '',
    cryptoBEP20: '',
    binanceId: '',
    paypal: '',
    mpesa: '',
    photoURL: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [loading, setLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    if (!user?.uid) return
    setLoading(true)
    const fetchProfile = async () => {
      try {
        const userDoc = doc(db, 'users', user.uid)
        const snapshot = await getDoc(userDoc)
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<FormState>
          setFormState((prev) => ({
            ...prev,
            ...data,
            email: data.email ?? user.email ?? '',
          }))
        } else {
          setFormState((prev) => ({
            ...prev,
            email: user.email || '',
          }))
        }
      } catch {
        toast({
          description: 'Failed to fetch user data.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user, toast])

  useEffect(() => {
    if (formState.firstName || formState.lastName) {
      setFormState((prev) => ({
        ...prev,
        fullName: `${prev.firstName} ${prev.lastName}`.trim(),
      }))
    }
  }, [formState.firstName, formState.lastName])

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState({ ...formState, [field]: e.target.value })
      setErrors({ ...errors, [field]: '' })
    }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (selectedFile) {
      const maxFileSize = 5 * 1024 * 1024 // 5 MB in bytes

      if (selectedFile?.size > maxFileSize) {
        // toast({
        //   description:
        //     'The file size exceeds the 5 MB limit. Please upload a smaller file.',
        //   variant: 'destructive',
        // })
        alert(
          'The file size exceeds the 5 MB limit. Please upload a smaller file.'
        )

        return
      }
      setFile(selectedFile)
    }
  }

  const handleDeletePhoto = async () => {
    if (!user?.uid || !formState.photoURL) return
    try {
      setLoading(true)
      const storageRef = ref(storage, `profilePics/${user.uid}`)
      await deleteObject(storageRef)
      await updateDoc(doc(db, 'users', user.uid), { photoURL: '' })
      setFormState((prev) => ({ ...prev, photoURL: '' }))
      toast({
        description: 'Profile picture successfully deleted.',
        variant: 'default',
      })
    } catch {
      toast({
        description: 'Failed to delete the profile picture.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (
      !formState.firstName.trim() ||
      !formState.lastName.trim() ||
      !formState.email.trim() ||
      !formState.countryCode ||
      !formState.phoneNumber.trim()
    ) {
      setErrors({
        firstName: !formState.firstName.trim()
          ? 'First name cannot be empty'
          : '',
        lastName: !formState.lastName.trim() ? 'Last name cannot be empty' : '',
        email: !formState.email.trim() ? 'Email cannot be empty' : '',
        countryCode: !formState.countryCode ? 'Select a country code' : '',
        phoneNumber: !formState.phoneNumber.trim()
          ? 'Phone number cannot be empty'
          : '',
      })
      return
    }
    if (!user?.uid) {
      toast({
        description: 'No user is logged in.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    try {
      let photoURL = formState.photoURL || ''
      if (file) {
        const storageRef = ref(storage, `profilePics/${user.uid}`)
        const uploadTask = uploadBytesResumable(storageRef, file)
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (err) => reject(err),
            async () => {
              photoURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve()
            }
          )
        })
      }
      await updateDoc(doc(db, 'users', user.uid), {
        ...formState,
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        email: formState.email.trim(),
        countryCode: formState.countryCode,
        phoneNumber: formState.phoneNumber.trim(),
        cryptoBEP20: formState.cryptoBEP20.trim(),
        binanceId: formState.binanceId.trim(),
        paypal: formState.paypal.trim(),
        mpesa: formState.mpesa.trim(),
        photoURL,
      })
      toast({
        description: 'Profile updated successfully.',
        variant: 'default',
      })
      setFormState((prev) => ({ ...prev, photoURL }))
      setFile(null)
    } catch {
      toast({
        description: 'Failed to update profile.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (field: keyof FormState) => {
    try {
      await navigator.clipboard.writeText(formState[field] || '')
      setCopiedField(field)
      setTimeout(() => setCopiedField(''), 2000)
    } catch {
      toast({
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <Typography variant="p">Loading profile...</Typography>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 md:px-4 my-4 mb-32">
      {/* USER DETAILS CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white font-medium">
            User Details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-[1rem]">
          {/* Profile Picture Upload */}
          <div className="flex flex-col gap-[0.5rem]">
            <Typography variant="span" className="font-semibold">
              Profile Picture
            </Typography>
            <div className="flex items-center gap-4">
              {/* Label and Hidden Input */}
              <label
                htmlFor="profile-pic-upload"
                className="flex items-center justify-center w-[2.5rem] h-[2.5rem] rounded-full bg-muted text-muted-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground border border-dashed"
              >
                <Plus className="text-[1.4rem]" />
              </label>
              <input
                id="profile-pic-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {/* Text Prompt */}
              <Typography variant="span" className="text-muted-foreground">
                Click to upload
              </Typography>
            </div>
            {/* Current photo preview */}
            {formState.photoURL && (
              <div className="flex items-center gap-2 mt-2">
                <Image
                  src={formState.photoURL}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="object-cover rounded-full border"
                />
                <Trash2
                  onClick={handleDeletePhoto}
                  className="text-red-500 cursor-pointer hover:text-red-700"
                />
              </div>
            )}
          </div>

          {/* Full Name (read-only) */}
          <div className="flex flex-col gap-[0.5rem]">
            <Typography variant="span" className="font-semibold">
              Full Name (auto)
            </Typography>
            <Input
              type="text"
              value={formState.fullName}
              className="w-full"
              readOnly
            />
          </div>

          {/* First & Last Names */}
          <div className="flex flex-col md:flex-row md:space-x-2 gap-[0.5rem]">
            <div className="md:w-1/2 mb-2 md:mb-0 flex flex-col gap-[0.5rem]">
              <Typography variant="span" className="font-semibold">
                First Name
              </Typography>
              <Input
                type="text"
                placeholder="Enter first name"
                value={formState.firstName}
                onChange={handleChange('firstName')}
                className="w-full mt-1"
              />
              {errors.firstName && (
                <Typography variant="span" className="text-red-500 text-sm">
                  {errors.firstName}
                </Typography>
              )}
            </div>
            <div className="md:w-1/2 flex flex-col gap-[0.5rem]">
              <Typography variant="span" className="font-semibold">
                Last Name
              </Typography>
              <Input
                type="text"
                placeholder="Enter last name"
                value={formState.lastName}
                onChange={handleChange('lastName')}
                className="w-full mt-1"
              />
              {errors.lastName && (
                <Typography variant="span" className="text-red-500 text-sm">
                  {errors.lastName}
                </Typography>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-[0.5rem]">
            <Typography variant="span" className="font-semibold">
              Email Address
            </Typography>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={formState.email}
              onChange={handleChange('email')}
              className="w-full mt-1"
              readOnly
            />
            {errors.email && (
              <Typography variant="span" className="text-red-500 text-sm">
                {errors.email}
              </Typography>
            )}
          </div>

          {/* Phone + Country Code */}
          <div className="flex flex-col gap-[0.5rem]">
            <Typography variant="span" className="font-semibold">
              Phone Number
            </Typography>
            <div className="flex flex-col md:flex-row md:space-x-2 mt-1">
              <div className="md:w-[22%] xl:w-[16%] mb-2 md:mb-0">
                <select
                  className="w-full h-[2.8rem] border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2 rounded"
                  value={formState.countryCode}
                  onChange={(e) => {
                    setFormState({ ...formState, countryCode: e.target.value })
                    setErrors({ ...errors, countryCode: '' })
                  }}
                >
                  <option value="">Select code</option>
                  {COUNTRIES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
                {errors.countryCode && (
                  <Typography variant="span" className="text-red-500 text-sm">
                    {errors.countryCode}
                  </Typography>
                )}
              </div>

              <div className="md:w-[78%]">
                <Input
                  type="tel"
                  placeholder="712345678"
                  value={formState.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                  className="w-full"
                />
                {errors.phoneNumber && (
                  <Typography variant="span" className="text-red-500 text-sm">
                    {errors.phoneNumber}
                  </Typography>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PAYMENT METHODS CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white font-medium">
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-[1rem]">
          {/* CRYPTO (BEP20) */}
          <div className="flex flex-col gap-[0.5rem]">
            <div className="flex items-center space-x-2 mb-1">
              <SiBinance size={20} className="text-yellow-500" />
              <Typography variant="span" className="font-semibold">
                Crypto (BEP20)
              </Typography>
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter Crypto BEP20 address"
                value={formState.cryptoBEP20}
                onChange={handleChange('cryptoBEP20')}
                className="w-full pr-10 overflow-hidden whitespace-nowrap text-ellipsis"
              />
              {copiedField === 'cryptoBEP20' ? (
                <Check className="w-4 h-4 cursor-pointer absolute right-3 top-[1.5rem] -translate-y-1/2 text-green-600" />
              ) : (
                <Copy
                  onClick={() => handleCopy('cryptoBEP20')}
                  className="w-4 h-4 cursor-pointer absolute right-3 top-[1.5rem] -translate-y-1/2 text-gray-500"
                />
              )}
            </div>
          </div>

          {/* BINANCE ID */}
          <div className="flex flex-col gap-[0.5rem]">
            <div className="flex items-center space-x-2 mb-1">
              <SiBinance size={20} className="text-yellow-500" />
              <Typography variant="span" className="font-semibold">
                Binance ID
              </Typography>
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter Binance ID"
                value={formState.binanceId}
                onChange={handleChange('binanceId')}
                className="w-full"
              />
              {copiedField === 'binanceId' ? (
                <Check className="w-4 h-4 cursor-pointer absolute top-[0.9rem] right-[0.6rem] text-green-600" />
              ) : (
                <Copy
                  className="w-4 h-4 cursor-pointer absolute top-[0.9rem] right-[0.6rem] text-gray-500"
                  onClick={() => handleCopy('binanceId')}
                />
              )}
            </div>
          </div>

          {/* PAYPAL */}
          <div className="flex flex-col gap-[0.5rem]">
            <div className="flex items-center space-x-2 mb-1">
              <SiPaypal size={20} className="text-blue-600" />
              <Typography variant="span" className="font-semibold">
                PayPal
              </Typography>
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter PayPal address"
                value={formState.paypal}
                onChange={handleChange('paypal')}
                className="w-full"
              />
              {copiedField === 'paypal' ? (
                <Check className="w-4 h-4 cursor-pointer absolute top-[0.9rem] right-[0.6rem] text-green-600" />
              ) : (
                <Copy
                  className="w-4 h-4 cursor-pointer absolute top-[0.9rem] right-[0.6rem] text-gray-500"
                  onClick={() => handleCopy('paypal')}
                />
              )}
            </div>
          </div>

          {/* MPESA */}
          <div className="flex flex-col gap-[0.5rem]">
            <div className="flex items-center space-x-2 mb-1">
              <FaMobileAlt size={18} className="text-green-600" />
              <Typography variant="span" className="font-semibold">
                M-PESA
              </Typography>
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter M-PESA number"
                value={formState.mpesa}
                onChange={handleChange('mpesa')}
                className="w-full"
              />
              {copiedField === 'mpesa' ? (
                <Check className="w-4 h-4 cursor-pointer absolute top-[0.9rem] right-[0.6rem] text-green-600" />
              ) : (
                <Copy
                  className="w-4 h-4 cursor-pointer absolute top-[0.9rem] right-[0.6rem] text-gray-500"
                  onClick={() => handleCopy('mpesa')}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SAVE / BACK BUTTONS */}
      <div className="w-full md:w-auto flex flex-col-reverse md:flex-row md:justify-end items-center gap-2 mt-4">
        {/* Back Button */}
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="w-full md:w-auto"
        >
          Back
        </Button>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full md:w-auto bg-primary text-white hover:bg-primary/80"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

export default Body
