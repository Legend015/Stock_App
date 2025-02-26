import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { Line } from "react-chartjs-2";
import "bootstrap/dist/css/bootstrap.min.css";
import "chart.js/auto";
import "./Stockchartapp.css";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";

// Register the zoom plugin
Chart.register(zoomPlugin);

const StockChartApp = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetch("/dump_cleaned.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const data = result.data;
            const companyNames = [
              ...new Set(data.map((row) => row.index_name)),
            ];
            setCompanies(companyNames);
          },
        });
      });
  }, []);

  const handleCompanyClick = (company) => {
    fetch("/dump_cleaned.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            let data = result.data.filter((row) => row.index_name === company);

            if (dateRange.start && dateRange.end) {
              data = data.filter(
                (row) =>
                  new Date(row.index_date) >= new Date(dateRange.start) &&
                  new Date(row.index_date) <= new Date(dateRange.end)
              );
            }

            data.sort(
              (a, b) => new Date(a.index_date) - new Date(b.index_date)
            );

            const newChartData = {
              labels: data.map((row) => row.index_date),
              datasets: [
                {
                  label: "Closing Price",
                  data: data.map((row) => parseFloat(row.closing_index_value)),
                  borderColor: "#007bff",
                  fill: false,
                },
                {
                  label: "Opening Price",
                  data: data.map((row) =>
                    parseFloat(row.open_index_value || 0)
                  ),
                  borderColor: "#28a745",
                  fill: false,
                },
              ],
            };

            setChartData(newChartData);
            setSelectedCompany(company);
          },
        });
      });
  };

  // Chart options including zoom and pan
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: "x", // Enable panning only in the X direction
        },
        zoom: {
          wheel: {
            enabled: true, // Enable zooming using the mouse wheel
          },
          pinch: {
            enabled: true, // Enable zooming using pinch gestures on touch devices
          },
          mode: "x", // Zoom in the X direction (time axis)
        },
      },
    },
  };

  // Reset zoom function
  const handleResetZoom = () => {
    if (chartInstance) {
      chartInstance.resetZoom();
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Sidebar for company list */}
        <div className="col-md-3 sidebar">
          <h5>Companies</h5>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Search Company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ul className="list-group company-list">
            {companies
              .filter((company) =>
                company.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((company, index) => (
                <li
                  key={index}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleCompanyClick(company)}
                  style={{ cursor: "pointer" }}
                >
                  {company}
                </li>
              ))}
          </ul>
        </div>

        {/* Main Chart Section */}
        <div className="col-md-9">
          <h5>Stock Chart</h5>
          <div className="d-flex gap-2 mb-3">
            <input
              type="date"
              className="form-control"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <input
              type="date"
              className="form-control"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>

          {selectedCompany && chartData ? (
            <>
              <div className="chart-container">
                <Line
                  data={chartData}
                  options={chartOptions}
                  ref={(chart) => setChartInstance(chart)}
                />
              </div>
              <button
                className="btn btn-warning mt-2"
                onClick={handleResetZoom}
              >
                Reset Zoom
              </button>
            </>
          ) : (
            <p className="text-muted">
              Select a company to view its stock chart.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChartApp;
