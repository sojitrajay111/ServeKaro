import { useEffect, useState, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';

export interface OrderItemDTO {
  orderItemId: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderResponseDTO {
  orderId: number;
  orderNumber: string;
  tableId: number | null;
  tableNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Cancelled' | 'Completed';
  totalAmount: number;
  notes: string | null;
  items: OrderItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusUpdateDTO {
  orderId: number;
  status: string;
}

const getHubUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (envUrl.startsWith('http')) {
    return envUrl.replace(/\/api\/?$/, '/orderHub');
  }
  return '/orderHub';
};

export const useOrderHub = (
  jwtToken: string | null,
  onNewOrder: (order: OrderResponseDTO) => void,
  onStatusUpdate: (update: StatusUpdateDTO) => void
) => {
  const [connectionState, setConnectionState] = useState<string>('Disconnected');
  const connectionRef = useRef<HubConnection | null>(null);

  // Store callbacks in refs to avoid recreating SignalR event listeners when callbacks change
  const onNewOrderRef = useRef(onNewOrder);
  const onStatusUpdateRef = useRef(onStatusUpdate);

  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
  }, [onNewOrder]);

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  useEffect(() => {
    if (!jwtToken) {
      setConnectionState('Disconnected');
      return;
    }

    const hubUrl = getHubUrl();
    console.log(`[SignalR] Connecting to orderHub at ${hubUrl}`);

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => jwtToken,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = connection;
    setConnectionState('Connecting');

    // Register event listeners
    connection.on('ReceiveNewOrder', (order: OrderResponseDTO) => {
      console.log('[SignalR] New order received:', order);
      onNewOrderRef.current?.(order);
    });

    connection.on('ReceiveStatusUpdate', (update: StatusUpdateDTO) => {
      console.log('[SignalR] Status update received:', update);
      onStatusUpdateRef.current?.(update);
    });

    // Connection lifecycle handlers
    connection.onreconnecting((error) => {
      console.warn('[SignalR] Connection reconnecting:', error);
      setConnectionState('Reconnecting');
    });

    connection.onreconnected((connectionId) => {
      console.log('[SignalR] Connection reconnected with ID:', connectionId);
      setConnectionState('Connected');
      // Re-join admin group on reconnect
      connection.invoke('JoinAdminGroup')
        .then(() => console.log('[SignalR] Re-joined Admin Group successfully'))
        .catch(err => console.error('[SignalR] Error re-joining Admin Group:', err));
    });

    connection.onclose((error) => {
      console.error('[SignalR] Connection closed:', error);
      setConnectionState('Disconnected');
    });

    // Start connection
    const startConnection = async () => {
      try {
        await connection.start();
        console.log('[SignalR] Connected successfully');
        setConnectionState('Connected');

        // Call JoinAdminGroup to start receiving broadcasts
        await connection.invoke('JoinAdminGroup');
        console.log('[SignalR] Joined Admin Group successfully');
      } catch (err) {
        console.error('[SignalR] Error starting connection:', err);
        setConnectionState('Disconnected');
      }
    };

    startConnection();

    return () => {
      if (connectionRef.current) {
        console.log('[SignalR] Cleaning up connection...');
        connectionRef.current.stop()
          .then(() => console.log('[SignalR] Connection stopped'))
          .catch(err => console.error('[SignalR] Error stopping connection:', err));
      }
    };
  }, [jwtToken]);

  return { connectionState };
};
