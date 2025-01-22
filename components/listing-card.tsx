import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ListingCardProps {
  seller: {
    name: string
    rating: string
    orders: number
    avatar: string
  }
  service: {
    title: string
    price: string
    currency: string
    description: string
  }
  paymentMethods: string[]
  onInteraction: () => void
}

export function ListingCard({ seller, service, paymentMethods, onInteraction }: ListingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={seller.avatar} alt={seller.name} />
              <AvatarFallback>{seller.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{seller.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{seller.orders} Orders</span>
                  <span>•</span>
                  <span>{seller.rating}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {service.currency} {service.price}
              </p>
              <div className="flex gap-2">
                {paymentMethods.map((method) => (
                  <Badge key={method} variant="secondary">
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onInteraction}>
              Purchase
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

