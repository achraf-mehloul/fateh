import React from 'react';
import { Check, Clock, Package, Truck, Home, XCircle } from 'lucide-react';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_STEPS, OrderStatus } from '@/lib/orders';

interface OrderStatusTrackerProps {
  order: Order;
}

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-5 w-5" />,
  confirmed: <Check className="h-5 w-5" />,
  preparing: <Package className="h-5 w-5" />,
  shipped: <Truck className="h-5 w-5" />,
  delivered: <Home className="h-5 w-5" />,
  cancelled: <XCircle className="h-5 w-5" />,
};

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ order }) => {
  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(order.status);

  return (
    <div className="w-full">
      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <div className="relative flex justify-between items-center">
          {/* Progress Line Background */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full" />
          
          {/* Progress Line Active */}
          <div 
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${(currentStepIndex / (ORDER_STATUS_STEPS.length - 1)) * 100}%` }}
          />

          {ORDER_STATUS_STEPS.map((status, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={status} className="relative flex flex-col items-center z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/30'
                      : 'bg-muted text-muted-foreground'
                  } ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}`}
                >
                  {statusIcons[status]}
                </div>
                <span
                  className={`mt-3 text-sm font-medium transition-colors ${
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {ORDER_STATUS_LABELS[status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Timeline */}
      <div className="md:hidden">
        <div className="relative">
          {ORDER_STATUS_STEPS.map((status, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isLast = index === ORDER_STATUS_STEPS.length - 1;

            return (
              <div key={status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/30'
                        : 'bg-muted text-muted-foreground'
                    } ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}`}
                  >
                    {statusIcons[status]}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 h-12 transition-colors ${
                        index < currentStepIndex
                          ? 'bg-gradient-to-b from-primary to-secondary'
                          : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
                <div className="pt-2 pb-6">
                  <span
                    className={`text-sm font-medium ${
                      isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground mt-1">الحالة الحالية</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusTracker;
