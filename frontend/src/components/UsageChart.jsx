import React, { useEffect, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2';
import { FaBars } from 'react-icons/fa';
import { IoSearch } from "react-icons/io5";
import { saveAs } from 'file-saver';
import instance from '../axios'
import * as XLSX from 'xlsx';
import 'chartjs-plugin-zoom';
import 'chart.js/auto';
import "../css/Chart.css"
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const UsageChart = ({userInfo}) => {

    const type = ["year", "month", "week"]
    const [chartType, setChartType] = useState('year')
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const [startDate, setStartDate] = useState(new Date().setDate(new Date().getDate() - 7)) // 기본값을 오늘로 설정
    const [endDate, setEndDate] = useState(new Date()) // 기본값을 오늘로 설정

    const chartRef = useRef(null)
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{
            label: '번역 이용시간',
            data: [],
            backgroundColor: 'rgba(75, 113, 217, 0.2)',
            borderColor: '#4b71d9',
            borderWidth: 2,
            pointBackgroundColor: '#4b71d9',
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true
        }]
    })

    const getSearchChartData = async () => {
        const res = await instance.post("/getSearchChartData", 
            { companyId: userInfo.companyId, chartType: chartType, 
                startYear: startDate.getFullYear(), startMonth: startDate.getMonth() + 1, startDay: startDate.getDate(),
                endYear: endDate.getFullYear(), endMonth: endDate.getMonth() + 1, endDay: endDate.getDate()
            })
        console.log("search",res);
        
        let resLabels = [], resData = []

        res.data.forEach(item => {
            resLabels.push(item.year +
                (item.month !== 0 ? "-" + item.month : "") +
                (item.day !== 0 ? "-" + item.day : "")
            )
            resData.push(item.usageTime)
        })

        setChartData(prevChartData => ({
            ...prevChartData,
            labels: resLabels,  // 새로 업데이트할 labels 값
            datasets: [{
                ...prevChartData.datasets[0],
                data: resData  // 새로 업데이트할 data 값
            }]
        }));
    }

    const getChartData = async () => {
        const res = await instance.post("/getChartData", { companyId: userInfo.companyId, chartType: chartType })

        let resLabels = [], resData = []

        res.data.forEach(item => {
            resLabels.push(item.year +
                (item.month !== 0 ? "-" + item.month : "") +
                (item.day !== 0 ? "-" + item.day : "")
            )
            resData.push(item.usageTime)
        })

        setChartData(prevChartData => ({
            ...prevChartData,
            labels: resLabels,  // 새로 업데이트할 labels 값
            datasets: [{
                ...prevChartData.datasets[0],
                data: resData  // 새로 업데이트할 data 값
            }]
        }));
    }

    useEffect(() => {
        getChartData()
    }, [chartType])

    const downloadImage = () => {
        const chart = chartRef.current;
        const base64Image = chart.toBase64Image();
        saveAs(base64Image, 'chart.png');
    };

    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            chartData.labels.map((label, index) => ({
                Date: label,
                Value: chartData.datasets[0].data[index]
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, 'chart_data.xlsx');
    };

    return (
        <div className="chart-wrapper">
            <div className="date-picker-container">
                <label>Start Date: </label>
                <DatePicker selected={startDate}
                    onChange={(date => { setStartDate(date) })} 
                    showMonthYearPicker={chartType === 'month'}
                    showYearPicker={chartType === 'year'}
                    showWeekNumbers={chartType === 'week'}
                    maxDate={new Date()}
                />
                <label>End Date: </label>
                <DatePicker selected={endDate}
                    onChange={(date => { setEndDate(date) })} maxDate={new Date()} />

                <IoSearch size={24} color='#fff' className='search-icon' onClick={() => getSearchChartData()}/>
                <FaBars size={24} color="#fff" onClick={() => setIsMenuOpen(!isMenuOpen)} className="menu-icon" />
                {isMenuOpen && (
                    <div className="menu-dropdown">
                        <ul>
                            <li onClick={downloadImage}>Download Image</li>
                            <li onClick={downloadExcel}>Download Excel</li>
                        </ul>
                    </div>
                )}
            </div>

            <div className="chart-controls">
                {type.map(item => (
                    <button key={item} onClick={() => setChartType(item)}>{item}</button>
                ))}
            </div>

            <div className="chart-container">
                <Line ref={chartRef} data={chartData}
                    options={{
                        scales: {
                            x: { ticks: { color: '#333333', font: { weight: 'bold', size: 12 } } },
                            y: {
                                beginAtZero: true, ticks: { color: '#000000', font: { size: 14 } }
                                , grid: { color: 'rgba(255, 255, 255, 0.2)', lineWidth: 1 }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: '#000000' } },
                            tooltip: { enabled: true, callbacks: { label: (tooltipItem) => `Value: ${tooltipItem.raw}` } },
                            zoom: {
                                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
                                pan: { enabled: true, mode: 'x' }
                            }
                        }
                    }}
                />
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chartData.labels.map((label, index) => (
                                <tr key={index}>
                                    <td>{label}</td>
                                    <td>{chartData.datasets[0].data[index]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default UsageChart