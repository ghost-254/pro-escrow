"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Headphones, Mail, Phone, Loader2, Send } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"
import { ScrollArea } from "@/components/ui/scroll-area"
import emailjs from "@emailjs/browser"
import { toast } from "react-toastify"

const Support: React.FC = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(String(email).toLowerCase())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate fields
    const newErrors: { [key: string]: string } = {}
    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) newErrors.email = "Email is required"
    else if (!validateEmail(email)) newErrors.email = "Invalid email format"
    if (!message.trim()) newErrors.message = "Message is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", { name, email, message }, "YOUR_USER_ID")
      toast.success("Message sent successfully!")
      setName("")
      setEmail("")
      setMessage("")
    } catch {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const supportOptions = [
    {
      title: "Telegram Support",
      description: "Get quick answers via our Telegram channel",
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      link: "https://t.me/XcrowSupport",
    },
    {
      title: "WhatsApp Support",
      description: "Chat with our support team on WhatsApp",
      icon: FaWhatsapp,
      color: "text-green-500",
      bgColor: "bg-green-100",
      link: "https://wa.me/15551234567",
    },
    {
      title: "Live Chat",
      description: "Chat with us directly on our website (Coming Soon)",
      icon: Headphones,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
      link: "#",
    },
  ]

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-6 px-4 md:py-12 bg-slate-200">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">Xcrow Support Center</h1>
        <p className="text-lg md:text-xl text-center text-muted-foreground mb-8">
          We're here to help you with any questions or issues you may have.
        </p>

        <Tabs defaultValue="contact" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="live-support">Live Support</TabsTrigger>
          </TabsList>
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Textarea
                      placeholder="Your Message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="min-h-[100px]"
                    />
                    {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Find quick answers to common questions about Xcrow.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How does Xcrow's escrow service work?</AccordionTrigger>
                    <AccordionContent>
                      Xcrow's escrow service facilitates secure transactions between buyers and sellers. The buyer
                      deposits funds, which are held securely until the seller delivers the agreed-upon service or
                      product. Once both parties confirm satisfaction, the funds are released to the seller.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>What fees does Xcrow charge?</AccordionTrigger>
                    <AccordionContent>
                      Xcrow charges a small percentage fee on successful transactions. The exact fee structure depends
                      on the transaction amount and type. Please refer to our pricing page for detailed information.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>How does Xcrow handle disputes?</AccordionTrigger>
                    <AccordionContent>
                      In case of a dispute, our team reviews the transaction details and communication history in the
                      Xcrow group chat. We work with both parties to reach a fair resolution based on the evidence
                      provided.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Is my personal and financial information secure with Xcrow?</AccordionTrigger>
                    <AccordionContent>
                      Yes, Xcrow uses industry-standard encryption and security measures to protect your personal and
                      financial information. We are compliant with relevant data protection regulations and never share
                      your data with third parties without your consent.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="live-support">
            <Card>
              <CardHeader>
                <CardTitle>Live Support Options</CardTitle>
                <CardDescription>Choose a support channel that works best for you.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full pr-4">
                  <div className="grid gap-6 md:grid-cols-3">
                    {supportOptions.map((option, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer transition-all hover:shadow-lg hover:bg-orange-100 dark:hover:bg-orange-900"
                        onClick={() => option.link !== "#" && window.open(option.link, "_blank")}
                      >
                        <CardHeader>
                          <div
                            className={`w-12 h-12 rounded-full ${option.bgColor} flex items-center justify-center mb-4`}
                          >
                            <option.icon className={`w-6 h-6 ${option.color}`} />
                          </div>
                          <CardTitle>{option.title}</CardTitle>
                          <CardDescription>{option.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardContent className="mt-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    <span>support@xcrow.co</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                </div>
              </CardContent>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our support team is available Monday to Friday, 9 AM to 5 PM EST.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}

export default Support

