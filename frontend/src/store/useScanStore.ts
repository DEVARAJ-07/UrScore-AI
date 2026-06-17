import { create } from 'zustand';

interface ScanState {
  activeScanId: string | null;
  logs: string[];
  progress: number;
  status: string;
  report: any | null;
  evidence: any | null;
  wsConnected: boolean;
  viewingReport: boolean;
  
  setViewReport: (val: boolean) => void;
  startScanSubscription: (scanId: string) => void;
  stopScanSubscription: () => void;
  setReportData: (report: any, evidence: any) => void;
  resetStore: () => void;
  appendLog: (log: string) => void;
}

let activeSocket: WebSocket | null = null;
let pollIntervalId: any = null;

export const useScanStore = create<ScanState>((set, get) => ({
  activeScanId: null,
  logs: [],
  progress: 0,
  status: 'idle',
  report: null,
  evidence: null,
  wsConnected: false,
  viewingReport: false,

  setViewReport: (val: boolean) => set({ viewingReport: val }),

  appendLog: (log: string) => {
    set((state) => ({ logs: [...state.logs, log] }));
  },

  startScanSubscription: (scanId: string) => {
    // Close existing socket and clear interval
    if (activeSocket) {
      activeSocket.close();
    }
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }

    set({
      activeScanId: scanId,
      progress: 0,
      status: 'pending',
      logs: [`[CLIENT] Connecting to intelligence websocket...`],
      report: null,
      evidence: null,
      wsConnected: false,
      viewingReport: false
    });

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const socketUrl = apiBase.replace(/^http/, 'ws');
    
    console.log(`Connecting to WebSocket: ${socketUrl}`);
    const socket = new WebSocket(socketUrl);
    activeSocket = socket;

    socket.onopen = () => {
      set({ wsConnected: true });
      get().appendLog(`[CLIENT] Connected. Requesting telemetry stream for scan: ${scanId}`);
      // Subscribe
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        scanId
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'SUBSCRIBED') {
          get().appendLog(`[SYSTEM] ${data.message}`);
        } 
        
        else if (data.type === 'SCAN_UPDATE') {
          set({
            status: data.status,
            progress: data.progress
          });
          
          if (data.logs && data.logs.length > 0) {
            data.logs.forEach((logLine: string) => {
              const currentLogs = get().logs;
              if (!currentLogs.includes(logLine)) {
                set((state) => ({ logs: [...state.logs, logLine] }));
              }
            });
          }

          // If completed, fetch report files
          if (data.status === 'completed') {
            get().appendLog(`[CLIENT] Fetching finalized report files...`);
            fetchReportAndEvidence(scanId, set);
            get().stopScanSubscription();
          } 
          
          else if (data.status === 'failed') {
            get().appendLog(`[SYSTEM] Execution failed. Pipeline terminated.`);
            get().stopScanSubscription();
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onclose = () => {
      set({ wsConnected: false });
      console.log('WebSocket connection closed');
      
      // If the scan is still running, start HTTP polling immediately as fallback
      const currentStatus = get().status;
      if (currentStatus === 'pending' || currentStatus === 'fetching_github') {
        startHttpPolling(scanId, set, get);
      }
    };

    socket.onerror = () => {
      set({ wsConnected: false });
      get().appendLog(`[CLIENT ERROR] WebSocket connection failed. Updates will poll via HTTP.`);
      startHttpPolling(scanId, set, get);
    };
  },

  stopScanSubscription: () => {
    if (activeSocket) {
      activeSocket.close();
      activeSocket = null;
    }
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
    set({ wsConnected: false });
  },

  setReportData: (report: any, evidence: any) => {
    set({ report, evidence });
  },

  resetStore: () => {
    if (activeSocket) {
      activeSocket.close();
      activeSocket = null;
    }
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
    set({
      activeScanId: null,
      logs: [],
      progress: 0,
      status: 'idle',
      report: null,
      evidence: null,
      wsConnected: false,
      viewingReport: false
    });
  }
}));

// Fallback HTTP Polling helper
function startHttpPolling(scanId: string, set: any, get: any) {
  if (pollIntervalId) return;

  get().appendLog(`[CLIENT] Initiating live HTTP telemetry polling fallback...`);

  pollIntervalId = setInterval(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiBase}/api/scans/${scanId}`);
      if (!res.ok) return;

      const scanData = await res.json();
      
      // Update store with telemetry details
      set({
        status: scanData.status,
        progress: scanData.progress,
        logs: scanData.logs || []
      });

      if (scanData.status === 'completed') {
        get().appendLog(`[CLIENT] Fetching finalized report files...`);
        fetchReportAndEvidence(scanId, set);
        get().stopScanSubscription();
      } else if (scanData.status === 'failed') {
        get().appendLog(`[SYSTEM] Execution failed. Pipeline terminated.`);
        get().stopScanSubscription();
      }
    } catch (err) {
      console.error('Error polling scan status:', err);
    }
  }, 3000);
}

// HTTP fetcher helper to get the generated report and store in Zustand
async function fetchReportAndEvidence(scanId: string, set: any) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const reportRes = await fetch(`${apiBase}/api/scans/${scanId}/report`);
    const evidenceRes = await fetch(`${apiBase}/api/scans/${scanId}/evidence`);
    
    if (reportRes.ok && evidenceRes.ok) {
      const report = await reportRes.json();
      const evidenceData = await evidenceRes.json();
      const evidence = evidenceData.raw_evidence || evidenceData;
      set({ report, evidence, status: 'completed', progress: 100 });
    }
  } catch (err) {
    console.error('Error fetching finalized scan data:', err);
  }
}
