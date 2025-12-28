import { CalendarClock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeliveryEstimationProps {
  orderDate: string;
  status: string;
  area?: string;
}

export function DeliveryEstimation({ orderDate, status, area }: DeliveryEstimationProps) {
  const getEstimatedDelivery = () => {
    const orderDateObj = new Date(orderDate);
    const isDhaka = area === 'dhaka';
    
    // Base delivery days based on location
    const baseDays = isDhaka ? 2 : 5;
    
    // Adjust based on status
    let daysRemaining = baseDays;
    switch (status) {
      case 'pending':
        daysRemaining = baseDays;
        break;
      case 'processing':
        daysRemaining = isDhaka ? 1 : 3;
        break;
      case 'shipped':
        daysRemaining = isDhaka ? 1 : 2;
        break;
      case 'delivered':
        return { date: null, text: 'Delivered', isDelivered: true };
      case 'cancelled':
        return { date: null, text: 'Cancelled', isCancelled: true };
    }
    
    // Calculate estimated date from today
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);
    
    // Add buffer for weekends
    const dayOfWeek = estimatedDate.getDay();
    if (dayOfWeek === 0) estimatedDate.setDate(estimatedDate.getDate() + 1);
    if (dayOfWeek === 6) estimatedDate.setDate(estimatedDate.getDate() + 2);
    
    return {
      date: estimatedDate,
      text: `${daysRemaining === 1 ? 'Tomorrow' : `In ${daysRemaining} days`}`,
      isDelivered: false,
      isCancelled: false
    };
  };

  const estimation = getEstimatedDelivery();
  
  if (estimation.isDelivered || estimation.isCancelled) {
    return null;
  }

  return (
    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <CalendarClock className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Estimated Delivery</p>
          <p className="text-lg font-bold text-primary">
            {estimation.date?.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {area === 'dhaka' ? 'Inside Dhaka (1-2 days)' : 'Outside Dhaka (3-5 days)'}
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {estimation.text}
        </Badge>
      </div>
    </div>
  );
}
