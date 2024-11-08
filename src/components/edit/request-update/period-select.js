import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { adToBs,bsToAd } from '@sbmdkl/nepali-date-converter';
import moment from 'moment'; 

export const PeriodSelector = ({ input, meta }) => {
    const { value: selectedPeriods } = input;
    const nepaliMonths = [
        { name: "Baisakh", period: "01" },
        { name: "Jestha", period: "02" },
        { name: "Ashadh", period: "03" },
        { name: "Shrawan", period: "04" },
        { name: "Bhadra", period: "05" },
        { name: "Ashoj", period: "06" },
        { name: "Kartik", period: "07" },
        { name: "Mangsir", period: "08" },
        { name: "Poush", period: "09" },
        { name: "Magh", period: "10" },
        { name: "Falgun", period: "11" },
        { name: "Chaitra", period: "12" },
    ];

    const currentYearAD = moment().year();
    const dateNP = adToBs(`${currentYearAD}-05-01`);
    let nepYear = dateNP.substring(0, 4);

    const initialYear = selectedPeriods?.[0]?.id.slice(0, 4) ||nepYear;
    const initialMonth = selectedPeriods?.[0]?.id.slice(4, 6) || '';

    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [validationMessage, setValidationMessage] = useState('');

    const convertDateToAD = (dateString) => {
        try {
            return bsToAd(dateString);
        } catch (e) {
            return dateString;
        }
    };

    const generatePeriodInfo = () => {
        if (selectedYear && selectedMonth) {
            const startofNextMonth = parseInt(selectedMonth) + 1;
            const startDateEN = `${selectedYear}-${selectedMonth}-01`;
            const endDateEN = `${selectedYear}-${startofNextMonth.toString().padStart(2, '0')}-01`;

            const startDate = convertDateToAD(startDateEN);
            const endPrevDate = convertDateToAD(endDateEN);
            const endDate = moment(endPrevDate).subtract(1, 'days').format('YYYY-MM-DD');

            const peInfo = [{
                id: `${selectedYear}${selectedMonth}`,
                uid: `${selectedYear}${selectedMonth}`,
                code: `${selectedYear}${selectedMonth}`,
                name: `${nepaliMonths.find(month => month.period === selectedMonth)?.name} ${selectedYear}`,
                dimensionItemType: "PERIOD",
                valueType: "TEXT",
                totalAggregationType: "SUM",
                startDate: `${startDate}`,
                endDate: `${endDate}`
            }];
            setValidationMessage('');
            input.onChange(peInfo);
        } else {
            setValidationMessage('* Choose at least one period');
        }
    };

    const handleMonthSelection = (e) => {
        const selectedPeriodValue = e.target.value;
        setSelectedMonth(selectedPeriodValue);
    };

    const handleYearSelection = (e) => {
        setSelectedYear(e.target.value);
    };

    useEffect(() => {
        generatePeriodInfo();
    }, [selectedYear, selectedMonth]);

    return (
        <>
            {/* Month Selector */}
            <select
                onChange={handleMonthSelection}
                value={selectedMonth}
                style={{ width: '200px', padding: '10px', fontSize: '16px' }}
                disabled={!selectedYear} 
            >
                <option value="" disabled>Select a Month</option>
                {nepaliMonths.map((month, index) => (
                    <option key={index} value={month.period}>
                        {month.name} {selectedYear}
                    </option>
                ))}
            </select>
            
            {/* Year Selector */}
            <input
                type="number"
                value={selectedYear}
                onChange={handleYearSelection}
                style={{ width: '100px', padding: '10px', fontSize: '16px', marginLeft: '10px' }}
                placeholder="Year"
            />
            
            {/* Validation Message */}
            {validationMessage && <p style={{ color: 'red', marginTop: '10px' }}>{validationMessage}</p>}
        </>
    );
};

PeriodSelector.propTypes = {
    input: PropTypes.object.isRequired,
    meta: PropTypes.object,
};
