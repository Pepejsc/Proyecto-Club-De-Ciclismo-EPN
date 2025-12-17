import React, { useState, useEffect } from "react";
import { getMembershipStats } from "../../services/membershipService";
import { toast } from "react-toastify";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../../assets/Styles/Admin/DashboardAdmin.css";

const apiUrl = process.env.REACT_APP_API_URL;

const DashboardAdmin = () => {
  const [stats, setStats] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState("6M");
  const [showModal, setShowmodal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [membersData, balanceRes] = await Promise.all([
        getMembershipStats(),
        fetch(`${apiUrl}/finanzas/balance`).then((res) => res.json()),
      ]);
      setStats(membersData);
      setBalance(balanceRes);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading)
    return <div className="dashboard-wrapper loading">Cargando Panel...</div>;
  if (!stats || !balance) return null;

  // --- DATOS PROCESADOS ---
  const totalMembers = stats.total_memberships || 0;
  const activeMembers = stats.by_status?.ACTIVE || 0;
  const pendingMembers = stats.by_status?.PENDING || 0;
  const inactiveMembers = stats.by_status?.INACTIVE || 0;

  const activePct = calculatePercentage(activeMembers, totalMembers);
  const pendingPct = calculatePercentage(pendingMembers, totalMembers);
  const stop1 = activePct;
  const stop2 = activePct + pendingPct;

  const chartData =
    chartFilter === "6M" ? balance.grafico.slice(-6) : balance.grafico;

  // --- LÓGICA FINANCIERA ---
  const totalIngresos = balance.resumen.ingresos_totales;
  const totalEgresos = balance.resumen.egresos_totales;
  const ratioGasto =
    totalIngresos > 0 ? (totalEgresos / totalIngresos) * 100 : 0;
  const ES_CRITICO = ratioGasto > 70;

const getTrendUI = (kpi) => {
    let arrow = '↑';
    let colorClass = 'neutral';
    let valueToShow = kpi.trend;

    if (kpi.type === 'INGRESOS') {
        arrow = kpi.trend >= 0 ? '↑' : '↓';
        colorClass = kpi.trend >= 0 ? 'positive' : 'negative';
        valueToShow = Math.abs(kpi.trend).toFixed(1) + '%';
    } 
    else if (kpi.type === 'EGRESOS') {
        if (ES_CRITICO) {
            arrow = '↓'; colorClass = 'negative'; valueToShow = 'Crítico';
        } else {
            arrow = '↑'; colorClass = 'positive'; valueToShow = 'Sano';
        }
    }
    else {
        arrow = '↑'; colorClass = 'positive'; valueToShow = 'Activo';
    }
    return { arrow, colorClass, text: valueToShow };
  };

  const kpiCards = [
    {
      title: "Ingresos Totales",
      value: `$${totalIngresos.toFixed(2)}`,
      trend: balance.kpis_calculados.ingresos.trend_percent,
      sub: "Acumulado histórico",
      type: "INGRESOS",
    },
    {
      title: "Egresos Totales",
      value: `$${totalEgresos.toFixed(2)}`,
      trend: balance.kpis_calculados.egresos.trend_percent,
      sub: `Ratio de Gasto: ${ratioGasto.toFixed(1)}%`,
      type: "EGRESOS",
    },
    {
      title: "Membresías",
      value: totalMembers,
      trend: 100,
      sub: `${activeMembers} Activas actualmente`,
      type: "MEMBRESIAS",
    },
    {
      title: "Auspicios",
      value: balance.kpis_calculados.auspicios.count || 0,
      trend: 100,
      sub: "Patrocinios recibidos",
      type: "AUSPICIOS",
    },
  ];

  return (
<div className="dashboard-wrapper">
      <div className="main-header-row">
        <h1 className="main-title">Panel Financiero</h1>
        <div className="chart-controls">
            {/* Aquí tus botones */}
            <button className="btn-refresh" onClick={loadAllData}>
                <i className="fas fa-sync-alt" style={{marginRight: '8px'}}></i> Actualizar Panel
            </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="top-section">
          
          <div className="kpi-grid">
            {kpiCards.map((kpi, index) => {
                const ui = getTrendUI(kpi);
                return (
                  <div key={index} className="kpi-card">
                    <div className="kpi-header">
                      <span className="kpi-title">{kpi.title}</span>
                      <div className={`kpi-indicator ${kpi.type === 'EGRESOS' && ES_CRITICO ? 'red' : 'green'}`}></div> 
                    </div>
                    <div className="kpi-body">
                      <div className="kpi-main-value">
                        <h2>{kpi.value}</h2>
                        <span className={`trend-badge ${ui.colorClass}`}>
                            {ui.arrow} {ui.text}
                        </span>
                      </div>
                      <p className="compare-text">{kpi.sub}</p>
                    </div>
                  </div>
                );
            })}
          </div>

          {/* --- DONA MODIFICADA --- */}
          <div className="donut-card">
             <h3>Estado de Membresías</h3>
             <div className="donut-wrapper">
                 <div className="donut-container">
                    <div className="donut-chart" style={{
                        background: `conic-gradient(
                            #3B82F6 0% ${stop1}%, 
                            #F59E0B ${stop1}% ${stop2}%, 
                            #EF4444 ${stop2}% 100%
                        )`
                    }}>
                        <div className="donut-hole"></div>
                    </div>
                 </div>
             </div>
             
             <div className="donut-legend">
                {/* Mostramos NÚMEROS en lugar de % */}
                <div className="legend-row">
                  <div className="legend-label-group"><span className="dot" style={{background: '#3B82F6'}}></span><span className="label">Activas</span></div>
                  <span className="val">{activeMembers}</span>
                </div>
                <div className="legend-row">
                  <div className="legend-label-group"><span className="dot" style={{background: '#F59E0B'}}></span><span className="label">Pendientes</span></div>
                  <span className="val">{pendingMembers}</span>
                </div>
                <div className="legend-row">
                  <div className="legend-label-group"><span className="dot" style={{background: '#EF4444'}}></span><span className="label">Inactivas</span></div>
                  <span className="val">{inactiveMembers}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="bottom-section">
          <div className="table-card">
            <h3>Productos Top Ventas</h3>
            <table className="products-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Nombre</th>
                  <th>Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {balance.top_productos.map((prod, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="prod-rank">#{idx + 1}</span>
                    </td>
                    <td className="prod-name">{prod.nombre}</td>
                    <td className="prod-val">
                      $ {prod.ingresos_generados.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="chart-card-large">
            <div className="chart-header-row" style={{ marginBottom: "1rem" }}>
              <h3>Evolución Ingresos</h3>
              <select
                className="chart-select"
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value)}
              >
                <option value="6M">Últimos 6 Meses</option>
                <option value="1Y">Todo el Año</option>
              </select>
            </div>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorIngresos"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorIngresos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;