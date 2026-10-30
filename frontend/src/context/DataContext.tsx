import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface DataContextType {
  loading: boolean;
  dashboardData: any;
  forecastData: any;
  recipes: any[];
  ingredients: any[];
  batches: any[];
  transactions: any[];
  procurementPlan: any[];
  suppliers: any[];
  alerts: any[];
  rescueCampaigns: any[];
  fetchAllData: () => Promise<void>;
  // Groq AI states
  aiRescueCampaigns: any[];
  setAiRescueCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  aiRescueLoading: boolean;
  setAiRescueLoading: React.Dispatch<React.SetStateAction<boolean>>;
  aiAuditModalItem: any;
  setAiAuditModalItem: React.Dispatch<React.SetStateAction<any>>;
  aiAuditData: any;
  setAiAuditData: React.Dispatch<React.SetStateAction<any>>;
  aiAuditLoading: boolean;
  setAiAuditLoading: React.Dispatch<React.SetStateAction<boolean>>;
  aiDiagnostics: any[];
  setAiDiagnostics: React.Dispatch<React.SetStateAction<any[]>>;
  aiDiagLoading: boolean;
  setAiDiagLoading: React.Dispatch<React.SetStateAction<boolean>>;
  // Transaction modal
  showTxModal: boolean;
  setShowTxModal: React.Dispatch<React.SetStateAction<boolean>>;
  txForm: any;
  setTxForm: React.Dispatch<React.SetStateAction<any>>;
  handleCreateTransaction: (e: React.FormEvent) => Promise<void>;
  // Simulator
  whatIfDemand: number;
  setWhatIfDemand: React.Dispatch<React.SetStateAction<number>>;
  simulationResult: any;
  setSimulationResult: React.Dispatch<React.SetStateAction<any>>;
  runWhatIfSimulation: (pct: number) => Promise<void>;
  // Shocks
  selectedWeather: string;
  setSelectedWeather: React.Dispatch<React.SetStateAction<string>>;
  selectedEvent: string;
  setSelectedEvent: React.Dispatch<React.SetStateAction<string>>;
  applyDemandShock: (weather?: string, event?: string) => Promise<void>;
  // Recommendation detail modal
  selectedRecBreakdown: any;
  setSelectedRecBreakdown: React.Dispatch<React.SetStateAction<any>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [procurementPlan, setProcurementPlan] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [rescueCampaigns, setRescueCampaigns] = useState<any[]>([]);

  // Groq Operational AI States
  const [aiRescueCampaigns, setAiRescueCampaigns] = useState<any[]>([]);
  const [aiRescueLoading, setAiRescueLoading] = useState(false);
  const [aiAuditModalItem, setAiAuditModalItem] = useState<any>(null);
  const [aiAuditData, setAiAuditData] = useState<any>(null);
  const [aiAuditLoading, setAiAuditLoading] = useState(false);
  const [aiDiagnostics, setAiDiagnostics] = useState<any[]>([]);
  const [aiDiagLoading, setAiDiagLoading] = useState(false);

  // Interactive Form & Modal States
  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({
    ingredient_id: 'ING-CHK',
    transaction_type: 'CONSUMED',
    quantity: 5.0,
    unit: 'kg',
    reference: 'Kitchen Dinner Prep',
    notes: 'Used in evening shift'
  });

  // What-If Simulator State
  const [whatIfDemand, setWhatIfDemand] = useState<number>(0);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Weather / Event Shock State
  const [selectedWeather, setSelectedWeather] = useState<string>('normal');
  const [selectedEvent, setSelectedEvent] = useState<string>('none');
  const [selectedRecBreakdown, setSelectedRecBreakdown] = useState<any>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, fcRes, recRes, ingRes, batchRes, txRes, planRes, suppRes, alertRes, rescueRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/forecast'),
        axios.get('/api/recipes'),
        axios.get('/api/ingredients'),
        axios.get('/api/inventory/batches'),
        axios.get('/api/inventory/transactions'),
        axios.get('/api/procurement/plan'),
        axios.get('/api/suppliers'),
        axios.get('/api/alerts'),
        axios.get('/api/spoilage-rescue')
      ]);

      setDashboardData(dashRes.data);
      setForecastData(fcRes.data);
      setRecipes(recRes.data);
      setIngredients(ingRes.data);
      setBatches(batchRes.data);
      setTransactions(txRes.data);
      setProcurementPlan(planRes.data);
      setSuppliers(suppRes.data);
      setAlerts(alertRes.data);
      setRescueCampaigns(rescueRes.data);
    } catch (err) {
      console.error('Error fetching data from backend API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/inventory/transactions', txForm);
      setShowTxModal(false);
      fetchAllData();
    } catch (err) {
      alert('Failed to log inventory transaction. Check backend connection.');
    }
  };

  const runWhatIfSimulation = async (pct: number) => {
    setWhatIfDemand(pct);
    try {
      const res = await axios.post('/api/simulator/what-if', {
        demand_multiplier_pct: pct,
        lead_time_delay_days: 0
      });
      setSimulationResult(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  const applyDemandShock = async (weather: string = selectedWeather, event: string = selectedEvent) => {
    try {
      await axios.post('/api/forecast/shock', {
        weather: weather,
        event: event
      });

      // Refetch forecast, procurement, and dashboard immediately to reflect live recalculation
      const [fcRes, planRes, dashRes] = await Promise.all([
        axios.get('/api/forecast'),
        axios.get('/api/procurement/plan'),
        axios.get('/api/dashboard')
      ]);

      setForecastData(fcRes.data);
      setProcurementPlan(planRes.data);
      setDashboardData(dashRes.data);
    } catch (err) {
      console.error('Failed to apply shock:', err);
    }
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        dashboardData,
        forecastData,
        recipes,
        ingredients,
        batches,
        transactions,
        procurementPlan,
        suppliers,
        alerts,
        rescueCampaigns,
        fetchAllData,
        aiRescueCampaigns,
        setAiRescueCampaigns,
        aiRescueLoading,
        setAiRescueLoading,
        aiAuditModalItem,
        setAiAuditModalItem,
        aiAuditData,
        setAiAuditData,
        aiAuditLoading,
        setAiAuditLoading,
        aiDiagnostics,
        setAiDiagnostics,
        aiDiagLoading,
        setAiDiagLoading,
        showTxModal,
        setShowTxModal,
        txForm,
        setTxForm,
        handleCreateTransaction,
        whatIfDemand,
        setWhatIfDemand,
        simulationResult,
        setSimulationResult,
        runWhatIfSimulation,
        selectedWeather,
        setSelectedWeather,
        selectedEvent,
        setSelectedEvent,
        applyDemandShock,
        selectedRecBreakdown,
        setSelectedRecBreakdown
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

