import i18n from '@dhis2/d2-i18n'
import { Box, NoticeBox, ReactFinalForm, Modal, Button } from '@dhis2/ui'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React, { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AttributeProvider, useAppContext } from '../../../context/index.js'
import { Loader } from '../../common/index.js'
import { RequestForm } from '../request-update/index.js'
import { EditItemFooter, EditTitle } from '../shared/index.js'
import { ExchangeFormContents } from './exchange-form-contents.js'
import styles from './exchange-form.module.css'
import { getInitialValuesFromExchange } from './getExchangeValues.js'
import { useRequests } from './useRequests.js'
import { getExchangeValuesFromForm } from './getExchangeValues.js'
import { config } from '../../../config';
import moment from 'moment';

import { useUpdateExchange } from './useUpdateExchange.js'
import { adToBs } from '@sbmdkl/nepali-date-converter'

const { Form } = ReactFinalForm

const formatError = (error) => {
    if (error.details?.response?.errorReports?.length > 0) {
        return error.details.response.errorReports.reduce(
            (stringified, rep) => {
                if (rep.message) {
                    return stringified + `\n${rep.message}`
                }
                return stringified
            },
            ''
        )
    }
    return error?.message
}



export const ExchangeForm = ({ exchangeInfo, addMode }) => {
    const {
        requestEditInfo,
        setRequestEditMode,
        exitRequestEditMode,
        requestsState,
        requestsDispatch,
        deleteRequest,
        requestsTouched,
        setRequestsTouched,
    } = useRequests({ exchangeInfo });
    const { refetchExchanges } = useAppContext();
    const navigate = useNavigate();
    const onComplete = useCallback(async () => {
        await refetchExchanges();
        navigate('/edit');
    }, [refetchExchanges, navigate]);

    const [saveExchange, { loading: saving, error }] = useUpdateExchange({
        onComplete,
    });
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [selectedDataset, setSelectedDataset] = useState('');
    const [datasetDetails, setDatasetDetails] = useState(null);
    const [isDataModalOpen, setDataModalOpen] = useState(false);
    const [DatamodalData, setDataModalData] = useState([]);
    const [formValues, setFormValues] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [analyticsRows, setAnalyticsRows] = useState([]);
    const [categoryOptionCombos, setCategoryOptionCombos] = useState([]);
    const [dataElements, setDataElements] = useState([]);
    const [peInfo, setPeInfo] = useState('');
    const [period, setPeriod] = useState('');
    const [orgUnit, setorgUnit] = useState('');
    const [ou, setoUnit] = useState('');
    const [err, setError] = useState('');
    const [showError, setShowError] = useState(!!error);
    const [reportingStatusRows, setReportingStatusRows] = useState([]);
    const [counterRows, setcounterRows] = useState({});
    const [isSyncStatusOpen, setSyncStatusOpen] = useState(false);
    const [statusData, setstatusData] = useState([]);
    const [results, setresults] = useState([]);
    const [dataSendStatus, setdataSendStatus] = useState(false);
    const [dataSendDate, setdataSendDate] = useState(' ');
    const baseUrl = config.baseUrl;



    useEffect(() => {
        if (error) {
            const errorMessage =
                'We are currently experiencing difficulties connecting to the HMIS server (hmis.gov.np/hmis). This may be due to server maintenance, high traffic, or temporary unavailability.';
            setError({ message: errorMessage });
        }
    }, [err, setError]);

    const handleRowClick = (id) => {
        setSelectedDataset(id)
        setIsLoading(true);

        fetchDatasetDetails();

    };

    const fetchDatasetDetails = async () => {

        if (!selectedDataset) return;
        try {
            // const baseUrl = config.baseUrl;            
            const programIndicatorsEndpoint = '/api/programIndicators';
            // const programIndicatorsUrl = `${baseUrl}${programIndicatorsEndpoint}?filter=attributeValues.value:eq:${selectedDataset}&paging=false`;
            const programIndicatorsUrl = `${baseUrl}${programIndicatorsEndpoint}?filter=q1EFKOJOh6C:eq:${selectedDataset}&paging=false`;

            const programIndicatorsData = await fetch(programIndicatorsUrl);
            const indicatorsEndpoint = '/api/indicators';
            const indicatorsUrl = `${baseUrl}${indicatorsEndpoint}?filter=q1EFKOJOh6C:eq:${selectedDataset}&paging=false`;
            const indicatorsData = await fetch(indicatorsUrl);


            if (programIndicatorsData.ok || indicatorsData.ok) {
                let dx = '';
                let id = '';
                let indicators = [];
                if (programIndicatorsData.ok) {
                    const fetchedprogramIndicatorsData = await programIndicatorsData.json();
                    dx = fetchedprogramIndicatorsData?.programIndicators?.map(data => data.id).join(';') || '';
                    id = fetchedprogramIndicatorsData?.programIndicators?.map(data => data.id).join(',') || '';
                }
                if (indicatorsData.ok) {
                    const fetchedIndicatorsData = await indicatorsData.json();
                    const indicatorDx = fetchedIndicatorsData?.indicators?.map(data => data.id).join(';') || '';
                    const indicatorId = fetchedIndicatorsData?.indicators?.map(data => data.id).join(',') || '';

                    dx = dx ? `${dx};${indicatorDx}` : indicatorDx;
                    id = id ? `${id},${indicatorId}` : indicatorId;
                }

                const values = modalData.values;
                const requests = modalData.requestsState
                const formattedValues = getExchangeValuesFromForm({
                    values,
                    requests,
                });
                let targetUrl = "https://hmis.gov.np/hmis/";
                // let targetUrl = "https://hmis.amakomaya.com/";

                const username = formattedValues?.target?.api.username
                const password = formattedValues?.target?.api.password
                const accessToken = formattedValues?.target?.api.accessToken
                const request = formattedValues?.source?.requests[0];
                const ou = request?.ou.join(';');
                setoUnit(ou);
                const periodData = request?.peInfo;
                const peInfo = periodData[0].id;
                setPeInfo(peInfo);
                const startDate = periodData[0].startDate;
                const endDate = periodData[0].endDate;
                const analyticsUrl = `${baseUrl}/api/analytics.json?dimension=dx:${dx}&dimension=ou:${ou}&startDate=${startDate}&endDate=${endDate}&outputOrgUnitIdScheme=ATTRIBUTE:tL7ErP7HBel`;
                const orgUnit = request?.ouInfo.map(({ name }) => name).join(', ')
                const period = periodData.map(({ name }) => name).join(', ')
                setPeriod(period)
                setorgUnit(orgUnit)

                if (dx.length > 0) {
                    const analyticsData = await fetch(analyticsUrl);
                    if (analyticsData.ok) {
                        const fetchedAnalyticsData = await analyticsData.json();
                        const rows = fetchedAnalyticsData.rows;
                        setAnalyticsRows(rows);
                        const programIndicatorsUrl = `${baseUrl}${programIndicatorsEndpoint}?filter=id:in:[${id}]&fields=id,name,aggregateExportCategoryOptionCombo,attributeValues&paging=false`;
                        const indicatorsUrl = `${baseUrl}${indicatorsEndpoint}?filter=id:in:[${id}]&fields=id,name,aggregateExportCategoryOptionCombo,attributeValues&paging=false`;
                        const [programIndicatorsData, indicatorsData] = await Promise.all([
                            fetch(programIndicatorsUrl).then(res => res.json()),
                            fetch(indicatorsUrl).then(res => res.json())
                        ]);

                        if (programIndicatorsData?.programIndicators) {
                            indicators = indicators.concat(programIndicatorsData.programIndicators);
                        }
                        if (indicatorsData?.indicators) {
                            indicators = indicators.concat(indicatorsData.indicators);
                        }

                        const categoryOptionCombos = indicators.map(indicator => indicator.aggregateExportCategoryOptionCombo);
                        setCategoryOptionCombos(categoryOptionCombos);

                        const dataElements = indicators.map(indicator => {
                            const attr = indicator.attributeValues?.find(attrVal => attrVal.attribute.id === "b8KbU93phhz");
                            return attr?.value;
                        });

                        setDataElements(dataElements);

                        let counters = {};

                        // const reportUrl = `${baseUrl}/api/sqlViews/MqE87cFhgmG/data?criteria=organisationunituid:${ou}&filter=occurreddate:ge:${startDate}&filter=occurreddate:le:${endDate}&paging=false`;
                        const reportUrl = `${baseUrl}/api/sqlViews/MqE87cFhgmG/data?criteria=organisationunituid:${ou}&criteria=occurreddate:ge:${startDate}&criteria=occurreddate:le:${endDate}&paging=false`;
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const response = await fetch(reportUrl);
                        const reportData = await response.json();
                        const dataRows = reportData.listGrid.rows || [];

                        const filteredAndSortedData = dataRows
                            .filter(row => {
                                const rowDate = new Date(row[2]);;
                                return rowDate >= start && rowDate <= end;
                            })
                        // const fetchedreportData = await reportData.json();
                        // const reportRows = fetchedreportData.listGrid.rows;
                        const reportRows = filteredAndSortedData;
                        

                        setReportingStatusRows(reportRows)
                        let orgUnitID = null;
                        if (selectedDataset === 'JduJyrFWhhJ' && reportRows.length > 0) {
                            reportRows.forEach((row) => {
                                orgUnitID = row[3];
                            });
                        } else {
                            rows.forEach((row) => {
                                orgUnitID = row[1];
                            });
                        }
                        orgUnitID = orgUnitID ?? ou;
                        const orgUnitResponse = await fetch(`${baseUrl}/api/organisationUnits/${orgUnitID}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });


                        const orgUnitData = await orgUnitResponse.json();
                        const orgUnitCode = orgUnitData.code;

                        const fetchedorgUnitID = await fetch(`${targetUrl}api/organisationUnits.json?filter=code:eq:${orgUnitCode}&fields=id,name,code`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Basic ' + btoa(`${username}:${password}`)
                            },
                        });
                        const targetOrgUnitData = await fetchedorgUnitID.json();
                        const targetorgUnitID = targetOrgUnitData.organisationUnits[0].id;

                        const fetchRegistrationResponse = await fetch(`${targetUrl}api/completeDataSetRegistrations.json?period=${peInfo}&dataSet=${selectedDataset}&orgUnit=${targetorgUnitID}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Basic ' + btoa(`${username}:${password}`)
                            },
                        });

                        const completeRegistration = await fetchRegistrationResponse.json();
                        if (
                            completeRegistration.completeDataSetRegistrations &&
                            completeRegistration.completeDataSetRegistrations[0].completed == true
                        ) {
                            const dataSendDate_en = completeRegistration.completeDataSetRegistrations[0].date;
                            const dataSendDate_np = adToBs(dataSendDate_en);
                            setdataSendStatus(true);
                            setdataSendDate(dataSendDate_np);
                        }
                        else {
                            setdataSendStatus(false);

                        }

                        const keyMappings = {
                            "0_9_YEARS-female": "XjuXeaVPUsr-I1gylzOskBs-val",
                            "0_9_YEARS-male": "XjuXeaVPUsr-TTNFd2X49S6-val",
                            "10_14_YEARS-female": "XjuXeaVPUsr-ciTvZ1HjQTw-val",
                            "10_14_YEARS-male": "XjuXeaVPUsr-SDgsEKTs0IH-val",
                            "15_19_YEARS-female": "XjuXeaVPUsr-RnH2ZpATWSI-val",
                            "15_19_YEARS-male": "XjuXeaVPUsr-ffNSZ7u5Y5P-val",
                            "20_59_YEARS-female": "XjuXeaVPUsr-sfmUgn8yywu-val",
                            "20_59_YEARS-male": "XjuXeaVPUsr-iUcXHCikw4W-val",
                            "60_69_YEARS-female": "XjuXeaVPUsr-COAFy42YNLg-val",
                            "60_69_YEARS-male": "XjuXeaVPUsr-D7tJYC2XYrC-val",
                            "GREATER_70-female": "XjuXeaVPUsr-M0yrPwi8vEK-val",
                            "GREATER_70-male": "XjuXeaVPUsr-DYUdGTQhgf9-val",

                            "1-0_9_YEARS-female": "HscG3R78Jzc-I1gylzOskBs-val",
                            "1-0_9_YEARS-male": "HscG3R78Jzc-TTNFd2X49S6-val",
                            "1-10_14_YEARS-female": "HscG3R78Jzc-ciTvZ1HjQTw-val",
                            "1-10_14_YEARS-male": "HscG3R78Jzc-SDgsEKTs0IH-val",
                            "1-15_19_YEARS-female": "HscG3R78Jzc-RnH2ZpATWSI-val",
                            "1-15_19_YEARS-male": "HscG3R78Jzc-ffNSZ7u5Y5P-val",
                            "1-20_59_YEARS-female": "HscG3R78Jzc-sfmUgn8yywu-val",
                            "1-20_59_YEARS-male": "HscG3R78Jzc-iUcXHCikw4W-val",
                            "1-60_69_YEARS-female": "HscG3R78Jzc-COAFy42YNLg-val",
                            "1-60_69_YEARS-male": "HscG3R78Jzc-D7tJYC2XYrC-val",
                            "1-GREATER_70-female": "HscG3R78Jzc-M0yrPwi8vEK-val",
                            "1-GREATER_70-male": "HscG3R78Jzc-DYUdGTQhgf9-val",

                            "yes-0_9_YEARS-female": "ZNYzRQGhxpd-I1gylzOskBs-val",
                            "yes-0_9_YEARS-male": "ZNYzRQGhxpd-TTNFd2X49S6-val",
                            "yes-10_14_YEARS-female": "ZNYzRQGhxpd-ciTvZ1HjQTw-val",
                            "yes-10_14_YEARS-male": "ZNYzRQGhxpd-SDgsEKTs0IH-val",
                            "yes-15_19_YEARS-female": "ZNYzRQGhxpd-RnH2ZpATWSI-val",
                            "yes-15_19_YEARS-male": "ZNYzRQGhxpd-ffNSZ7u5Y5P-val",
                            "yes-20_59_YEARS-female": "ZNYzRQGhxpd-sfmUgn8yywu-val",
                            "yes-20_59_YEARS-male": "ZNYzRQGhxpd-iUcXHCikw4W-val",
                            "yes-60_69_YEARS-female": "ZNYzRQGhxpd-COAFy42YNLg-val",
                            "yes-60_69_YEARS-male": "ZNYzRQGhxpd-D7tJYC2XYrC-val",
                            "yes-GREATER_70-female": "ZNYzRQGhxpd-M0yrPwi8vEK-val",
                            "yes-GREATER_70-male": "ZNYzRQGhxpd-DYUdGTQhgf9-val"
                        };
                        reportRows.forEach(row => {
                            let [trackedentityid, programstageid, occurreddate, organisationunituid, old_new_value, referred_value, age_group, gender, age_gender] = row;
                            if (!gender || gender.trim() === "") {
                                gender = "female";
                            }

                            if (referred_value && referred_value.trim() !== "") {
                                referred_value = "yes";
                            }
                            let key1 = keyMappings[`${age_group}-${gender}`];
                            let key2 = keyMappings[`${old_new_value}-${age_group}-${gender}`];
                            let key3 = keyMappings[`${referred_value}-${age_group}-${gender}`];


                            if (key1) {
                                counters[key1] = (counters[key1] || 0) + 1;
                            }
                            if (key2) {
                                counters[key2] = (counters[key2] || 0) + 1;
                            }
                            if (key3) {
                                counters[key3] = (counters[key3] || 0) + 1;
                            }

                        });
                        setcounterRows(counters)

                        let result = {};
                        rows.forEach(row => {
                            const [value, orgunitID, rowValue] = row;
                            indicators.forEach(indicator => {
                                const matchingAttribute = indicator.id;
                                const matchingAttributeId = indicator.attributeValues.find(attribute => attribute.attribute.id === "b8KbU93phhz");
                                if (matchingAttribute === value) {
                                    const key = `${matchingAttributeId.value}-${indicator.aggregateExportCategoryOptionCombo}-val`;
                                    result[key] = rowValue;
                                }

                            });
                        });
                        setresults(result)



                        if (username && password) {
                            const fetchResponse = await fetch(`${targetUrl}api/dataSets/${selectedDataset}/metadata.json`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Basic ' + btoa(`${username}:${password}`)
                                },
                            });
                            if (fetchResponse.ok) {
                                const data = await fetchResponse.json();
                                const HtmlCode = data?.dataEntryForms?.map(form => {
                                    if (form.htmlCode) {
                                        let updatedHtml = form.htmlCode
                                            .replace(/\\n/g, '')
                                            .replace(/\\t/g, '')
                                            .replace(/\\/g, '')
                                            .replace(/<input\b([^>]*)>/g, '<input$1 disabled>');


                                        if (Object.keys(result).length > 0) {
                                            Object.keys(result).forEach(key => {
                                                const inputId = key;
                                                const inputValue = result[key];
                                                updatedHtml = updatedHtml.replace(new RegExp(`id="${inputId}"`, 'g'), `id="${inputId}" value="${inputValue}"`);
                                            });
                                        }
                                        if (Object.keys(counters).length > 0) {
                                            Object.keys(counters).forEach(key => {
                                                const inputId = key;
                                                const inputValue = counters[key];
                                                updatedHtml = updatedHtml.replace(new RegExp(`id="${inputId}"`, 'g'), `id="${inputId}" value="${inputValue}"`);
                                            });
                                        }


                                        return updatedHtml;
                                    }

                                    return form.htmlCode.replace(/\\n/g, '').replace(/\\t/g, '').replace(/\\/g, '');
                                });

                                setDatasetDetails(HtmlCode);
                            }

                        }
                        else {
                            const fetchResponse = await fetch(`${targetUrl}api/dataSets/${selectedDataset}/metadata.json`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'ApiToken ' + accessToken
                                },
                            });

                            if (fetchResponse.ok) {
                                const data = await fetchResponse.json();
                                const HtmlCode = data?.dataEntryForms?.map(form => {
                                    if (form.htmlCode) {
                                        let updatedHtml = form.htmlCode
                                            .replace(/\\n/g, '')
                                            .replace(/\\t/g, '')
                                            .replace(/\\/g, '')
                                            .replace(/<input\b([^>]*)>/g, '<input$1 disabled>');


                                        if (Object.keys(result).length > 0) {
                                            Object.keys(result).forEach(key => {
                                                const inputId = key;
                                                const inputValue = result[key];
                                                updatedHtml = updatedHtml.replace(new RegExp(`id="${inputId}"`, 'g'), `id="${inputId}" value="${inputValue}"`);
                                            });
                                        }
                                        if (Object.keys(counters).length > 0) {
                                            Object.keys(counters).forEach(key => {
                                                const inputId = key;
                                                const inputValue = counters[key];
                                                updatedHtml = updatedHtml.replace(new RegExp(`id="${inputId}"`, 'g'), `id="${inputId}" value="${inputValue}"`);
                                            });
                                        }

                                        return updatedHtml;
                                    }

                                    return form.htmlCode.replace(/\\n/g, '').replace(/\\t/g, '').replace(/\\/g, '');
                                });

                                setDatasetDetails(HtmlCode);
                            }
                        }
                    }
                }
                else {
                    if (username && password) {
                        const fetchResponse = await fetch(`${targetUrl}api/dataSets/${selectedDataset}/metadata.json`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Basic ' + btoa(`${username}:${password}`)
                            },
                        });
                        if (fetchResponse.ok) {
                            const data = await fetchResponse.json();
                            const HtmlCode = data?.dataEntryForms?.map(form => {
                                if (form.htmlCode) {
                                    let updatedHtml = form.htmlCode
                                        .replace(/\\n/g, '')
                                        .replace(/\\t/g, '')
                                        .replace(/\\/g, '');


                                    return updatedHtml;
                                }

                                return '';
                            });
                            const combinedHtml = HtmlCode.join('') + '<p><strong>No data found</strong></p>'

                            setDatasetDetails(combinedHtml);
                        }

                    }
                    else {
                        const fetchResponse = await fetch(`${targetUrl}api/dataSets/${selectedDataset}/metadata.json`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'ApiToken ' + accessToken
                            },
                        });

                        if (fetchResponse.ok) {
                            const data = await fetchResponse.json();
                            const HtmlCode = data?.dataEntryForms?.map(form => {
                                if (form.htmlCode) {
                                    let updatedHtml = form.htmlCode
                                        .replace(/\\n/g, '')
                                        .replace(/\\t/g, '')
                                        .replace(/\\/g, '')
                                        .replace(/<input\b([^>]*)>/g, '<input$1 disabled>');

                                    return updatedHtml;
                                }

                                return '';
                            });
                            const combinedHtml = HtmlCode.join('') + '<p><strong>No data found</strong></p>'

                            setDatasetDetails(combinedHtml);
                        }
                    }
                }
                setIsLoading(false);


            }



        } catch (err) {
            console.error('Error fetching dataset details:', err);
            setError(err)

        }
    };
    const handleCloseModal = () => {
        setModalOpen(false);
    };
    const handleClearError = () => {
        setError(false);
        setShowError(false);
    };



    const handleCloseDataModal = () => {
        setDataModalOpen(false);
        setModalOpen(true);
        setSyncStatusOpen(false)


    };

    // const OpenLogModal =async() =>{
    //     const { values, requestsState } = modalData;
    //     const dataValues = getExchangeValuesFromForm({ values, requests: requestsState });
    //     dataValues?.target?.api.url;
    //         const username = dataValues?.target?.api.username;
    //         const password = dataValues?.target?.api.password;
    //         const accessToken = dataValues?.target?.api.accessToken;
    //         if (targetUrl && !targetUrl.endsWith('/')) {
    //             targetUrl += '/';
    //         }
    //         let orgUnitID = null;

    //         if (selectedDataset == 'JduJyrFWhhJ') {
    //             reportingStatusRows.forEach((row) => {
    //                 orgUnitID = row[3];
    //             });
    //         } 
    //         if(analyticsRows.length>0) {
    //             analyticsRows.forEach((row) => {
    //                 orgUnitID = row[1];
    //             });
    //         }
    //         console.log(orgUnitID,'orgUnitID')
    //         let response;

    //         if (username && password) {
    //             const responseData = await fetch(`${targetUrl}api/dataValueSets.json?dataSet=${selectedDataset}&period=${peInfo}&orgUnit=${orgUnitID}`, {
    //                 method: 'GET',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'Authorization': 'Basic ' + btoa(`${username}:${password}`),
    //                 },
    //             });
    //             response = await responseData.json();
    //             if (!responseData.ok) {
    //                 console.error('Failed to fetch data', response);
    //                 const errorMessage = 'Failed to fetch data';
    //                 setError({ message: errorMessage }); 
    //                 setShowError(true)
    //                 setIsLoading(false)
    //                 return;
    //             }
    //             console.log(response,'response')
    //             setSyncStatusOpen(true)
    //             setstatusData(response)

    //         }


    // };

    const handleConfirm = async () => {
        try {
            setError('')
            setShowError(false);
            setIsLoading(true);
            const { values, requestsState } = modalData;
            const dataValues = getExchangeValuesFromForm({ values, requests: requestsState });
            const baseUrl = config.baseUrl;            
            // const baseUrl = config.baseUrl;            
            let targetUrl = 'https://hmis.gov.np/hmis/';
            // let targetUrl = "https://hmis.amakomaya.com/";

            const username = dataValues?.target?.api.username;
            const password = dataValues?.target?.api.password;
            const accessToken = dataValues?.target?.api.accessToken;
            if (targetUrl && !targetUrl.endsWith('/')) {
                targetUrl += '/';
            }
            let orgUnitID = null;
            if (selectedDataset === 'JduJyrFWhhJ' && reportingStatusRows.length > 0) {
                reportingStatusRows.forEach((row) => {
                    orgUnitID = row[3];
                });
            } else {
                analyticsRows.forEach((row) => {
                    orgUnitID = row[1];
                });
            }
            const targetOrgUnitID = orgUnitID ?? ou;
            const orgUnitResponse = await fetch(`${baseUrl}/api/organisationUnits/${targetOrgUnitID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });


            if (!orgUnitResponse.ok) {
                console.error('Failed to fetch organisation unit:', orgUnitResponse.statusText);
                const errorMessage = 'Failed to fetch organisation unit';
                setError({ message: errorMessage });
                setShowError(true)
                setIsLoading(false)
                return;
            }

            const orgUnitData = await orgUnitResponse.json();
            const orgUnitCode = orgUnitData.code;
            let dataValue = [];

            const mappedResults = Object.entries(results).map(([key, value]) => {
                const [dataElement, categoryOptionCombo] = key.split('-');
                return {
                    dataElement,
                    categoryOptionCombo,
                    value: Number(value)
                };
            });

            if (selectedDataset === 'JduJyrFWhhJ') {
                const mappedCounterRows = Object.entries(counterRows).map(([key, value]) => {
                    const [dataElement, categoryOptionCombo] = key.split('-').slice(0, 2);
                    return {
                        dataElement,
                        categoryOptionCombo,
                        value
                    };
                });

                dataValue = [...mappedCounterRows, ...mappedResults];
            } else {
                dataValue = mappedResults;
            }


            const payload = {
                dataSet: selectedDataset,
                completeDate: moment().format('YYYY-MM-DD'),
                period: peInfo,
                orgUnitIdScheme: 'code',
                orgUnit: orgUnitCode,
                dataValues: dataValue
            };
            let dataValueResponse;
            if (<div
                style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '20px',
                    marginLeft: '50px',
                    float: 'right',
                    overflowX: 'auto',
                }}
            >
                {datasetDetails ? (
                    <div>
                        <form>
                            <p><strong>Organization Unit: {orgUnit}</strong></p>
                            <p><strong>Periods: {period}</strong></p>

                            <div dangerouslySetInnerHTML={{ __html: datasetDetails }} />
                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    style={{
                                        padding: '10px 15px',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        marginRight: '10px',
                                    }}
                                    primary
                                    onClick={handleConfirm}
                                >
                                    {i18n.t('Confirm and Send')}
                                </Button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <span data-test="saving-exchange-loader">
                        <Loader />
                    </span>
                )}
            </div>
                && password) {
                dataValueResponse = await fetch(`${targetUrl}api/dataValueSets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                dataValueResponse = await fetch(`${targetUrl}api/dataValueSets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'ApiToken ' + accessToken,
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (!dataValueResponse.ok) {
                console.error('Failed to send data values:', dataValueResponse.statusText);
                const errorMessage = 'Failed to fetch organisation unit';
                setError(errorMessage);
                setShowError(true)
                setIsLoading(false);


                return;
            }

            const responseData = await dataValueResponse.json();
            setDataModalData(responseData);
            setModalOpen(false);
            setDataModalOpen(true);
            setIsLoading(false);


        } catch (error) {
            console.error('Error during data processing:', error.message);
            setError(error)
            setShowError(true)
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (modalData?.datasetData && modalData.datasetData.length > 0) {
            setSelectedDataset(modalData.datasetData[0].id);
        }
    }, [modalData?.datasetData]);

    useEffect(() => {
        if (selectedDataset) {
            fetchDatasetDetails();
        }
    }, [selectedDataset]);

    useEffect(() => {
        if (error || err) {
            setShowError(true);
            const timer = setTimeout(() => {
                setShowError(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [error]);



    useEffect(() => {
        if (exchangeInfo) {
            setFormValues(getInitialValuesFromExchange({ exchangeInfo }));
        }
    }, [exchangeInfo]);



    return (
        <>
            {!isModalOpen && !isDataModalOpen && (
                <Form
                    onSubmit={async (values, form) => {
                        setFormValues(values);

                        try {
                            const response = await saveExchange({
                                values,
                                form,
                                id: exchangeInfo?.id,
                                requests: requestsState,
                                requestsTouched,
                                newExchange: addMode,
                            });

                            if (response.dataSets) {
                                const baseUrl = config.baseUrl;
                                const datasetData = response.dataSets;
                                const dataStoreResponse = await fetch(`${baseUrl}/api/dataStore/hmisreport/enabled_dataset`);
                                if (!dataStoreResponse.ok) {
                                    throw new Error(`DataStore fetch failed: ${dataStoreResponse.statusText}`);
                                }
                                const dataStoreConfig = await dataStoreResponse.json();
                                const enabledIds = dataStoreConfig.enabled_dataset || [];
                                const filteredDatasets = datasetData.filter(ds =>
                                    enabledIds.includes(ds.id)
                                );

                                const combinedData = {
                                    // datasetData,
                                    datasetData: filteredDatasets,
                                    values,
                                    requestsState,
                                };

                                setModalData(combinedData);
                                setModalOpen(true);
                            }

                        } catch (err) {
                            console.error('Failed to save exchange:', err);
                            setError(err)


                        }
                    }}
                    initialValues={formValues}
                    keepDirtyOnReinitialize


                >

                    {({ handleSubmit }) => (
                        <div>
                            <div
                                className={classNames(styles.fullHeight, {
                                    [styles.hidden]: requestEditInfo?.editMode,
                                })}
                            >
                                <div className={styles.editArea}>
                                    <div
                                        className={styles.editContainer}
                                        data-test="add-exchange-title"
                                    >
                                        <div className={styles.editFormArea}>
                                            {saving && (
                                                <span data-test="saving-exchange-loader">
                                                    <Loader />
                                                </span>
                                            )}
                                            {error && showError && (
                                                <NoticeBox
                                                    error
                                                    title="Could fetch data"
                                                    className={
                                                        styles.errorBoxContainer
                                                    }
                                                >
                                                    {error.message}
                                                </NoticeBox>
                                            )}

                                            {!saving && (
                                                <ExchangeFormContents
                                                    requestsState={requestsState}
                                                    setRequestEditMode={setRequestEditMode}
                                                    deleteRequest={deleteRequest}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <footer
                                    className={styles.bottomBar}
                                    data-test="edit-item-footer"
                                >
                                    <EditItemFooter
                                        handleSubmit={handleSubmit}
                                        requestsTouched={requestsTouched}
                                        requestsState={requestsState}
                                    />
                                </footer>
                            </div>
                            {requestEditInfo?.editMode && (
                                <div className={styles.fullHeight}>
                                    <RequestForm
                                        exitRequestEditMode={exitRequestEditMode}
                                        request={requestEditInfo?.request}
                                        requestsDispatch={requestsDispatch}
                                        addModeRequest={requestEditInfo?.addModeRequest}
                                        setRequestsTouched={setRequestsTouched}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </Form>
            )}

            {isModalOpen && !isDataModalOpen && !isSyncStatusOpen && (
                <div
                    style={{
                        marginTop: '20px',
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '100%',
                        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    {err && showError && (
                        <NoticeBox
                            error
                            title="Error"
                            className={styles.errorBoxContainer}
                        >
                            <p>{err.message}</p>
                        </NoticeBox>
                    )}

                    {err && showError && (() => {
                        setTimeout(() => handleClearError(), 2000);
                        return null;
                    })()}

                    {/* {isLoading &&( 
                        <span>
                            <Loader />
                        </span>
                                            
                    
                 )} */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <Button
                            style={{
                                padding: '10px 15px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                            primary
                            onClick={handleCloseModal}
                        >
                            {i18n.t('Reset')}
                        </Button>

                        {/* <Button
                        style={{
                        padding: '10px 15px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        }}
                        primary
                        onClick={OpenLogModal}

                    >
                        {i18n.t('Sync Status')}
                    </Button> */}
                    </div>
                    <h3 style={{ margin: '0', fontSize: '12px' }}>Select a Program</h3>

                    <div style={{ display: 'flex' }}>
                        <table
                            style={{
                                width: '300px',
                                height: '400px',
                                borderCollapse: 'collapse',
                                marginBottom: '20px',
                                float: 'left',
                                overflowX: 'auto'
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            padding: '10px',
                                            border: '1px solid #ccc',
                                            textAlign: 'center',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Dataset Name
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalData?.datasetData.map(({ id, displayName }) => (
                                    <tr
                                        key={id}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedDataset === id ? '#d0e6ff' : 'white',

                                        }}
                                        onClick={() => !isLoading && handleRowClick(id)}
                                        message
                                    >
                                        <td
                                            style={{
                                                padding: '10px',
                                                border: '1px solid #ccc',
                                                fontSize: '12px'
                                            }}

                                        >
                                            {displayName}
                                        </td>

                                    </tr>
                                ))}

                            </tbody>
                        </table>




                        <div
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                marginBottom: '20px',
                                marginLeft: '50px',
                                float: 'right',
                                overflowX: 'auto',
                            }}
                        >
                            {/* {datasetDetails ? (
                                <div>
                                    <form>
                                        <p><strong style={{fontSize:'12px'}}>Organization Unit: {orgUnit}</strong></p>
                                        <p><strong style={{fontSize:'12px'}}>Periods: {period}</strong></p>


                                        <div dangerouslySetInnerHTML={{ __html: datasetDetails }} />
                                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button
                                                style={{
                                                    padding: '10px 15px',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    marginRight: '10px',
                                                }}
                                                primary
                                                onClick={handleConfirm}
                                            >
                                                {i18n.t('Confirm and Send')}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <span data-test="saving-exchange-loader">
                                    <Loader />
                                </span>
                            )} */}


                            {/* new dataset details after applying loader */}

                            {isLoading ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flexDirection: 'column',
                                        height: '100%',
                                        minHeight: '200px'
                                    }}
                                >
                                    <Loader />
                                    <p style={{ marginTop: '10px', fontSize: '12px' }}>Loading Details...</p>
                                </div>
                            ) : datasetDetails ? (
                                <div>
                                    <form>
                                        <p>
                                            <strong style={{ fontSize: '12px' }}>
                                                Organization Unit: {orgUnit}
                                            </strong>
                                        </p>
                                        <p>
                                            <strong style={{ fontSize: '12px' }}>
                                                Periods: {period}
                                            </strong>
                                        </p>

                                        <Button
                                            style={{
                                                padding: '10px 15px',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                marginRight: '10px',
                                                boxShadow: '0 0 10px #4cafef',
                                                backgroundColor: '#2196f3',
                                                color: '#fff',
                                                transition: '0.3s',
                                                marginBottom: '10px'
                                            }}
                                        >
                                            Open
                                        </Button>

                                        <div dangerouslySetInnerHTML={{ __html: datasetDetails }} />

                                        {dataSendStatus ? (
                                            <p>
                                                <strong style={{ fontSize: '12px' }}>
                                                    यो महिनाको डाटा सेटको डाटा मिति {dataSendDate} मा पठाईसकेको छ ।
                                                    तपाईले पूर्ण पठाउन चाहेमा "Confirm and Send " मा किल्क गर्नुहोस् ।
                                                </strong>
                                            </p>
                                        ) : (
                                            <p>
                                                <strong style={{ fontSize: '12px' }}>
                                                    यो महिनाको डाटा सेटको डाटा हाल सम्म पठाइएको छैन ।
                                                </strong>
                                            </p>
                                        )}

                                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button
                                                style={{
                                                    padding: '10px 15px',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                }}
                                                primary
                                                onClick={handleConfirm}
                                            >
                                                {i18n.t('Confirm and Send')}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '12px' }}>
                                    Please select a dataset from the list to view details.
                                </div>
                            )}

                            {/*  old dataset details */}
                            {/* {datasetDetails ? (
                                <div>
                                    <form>
                                        <p>
                                            <strong style={{ fontSize: '12px' }}>
                                                Organization Unit: {orgUnit}
                                            </strong>
                                        </p>
                                        <p>
                                            <strong style={{ fontSize: '12px' }}>
                                                Periods: {period}
                                            </strong>
                                        </p>

                                         <Button
                                                style={{
                                                    padding: '10px 15px',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    marginRight: '10px',
                                                    boxShadow: '0 0 10px #4cafef', 
                                                    backgroundColor: '#2196f3',
                                                    color: '#fff',
                                                    transition: '0.3s',
                                                    alignItems:'flex-end',
                                                    marginBottom:'10px'
                                                }}
                                            >
                                                Open
                                            </Button> 

                                        <div dangerouslySetInnerHTML={{ __html: datasetDetails }} />
                                       {dataSendStatus ?(
                                           <p> <strong style={{fontSize:'12px'}}>यो महिनाको डाटा सेटको डाटा मिति {dataSendDate} मा पठाईसकेको छ । तपाईले पूर्ण पठाउन चाहेमा "Confirm and Send " मा किल्क गर्नुहोस् । </strong></p>
                                       ):<p> <strong style={{fontSize:'12px'}}>यो महिनाको डाटा सेटको डाटा हाल सम्म पठाइएको छैन । </strong></p>} 
                                        <div
                                            style={{
                                                marginTop: '15px',
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                                                        <Button
                                                                            style={{
                                                                                padding: '10px 15px',
                                                                                border: 'none',
                                                                                borderRadius: '5px',
                                                                                cursor: 'pointer',
                                                                                marginRight: '10px',
                                                                            }}
                                                                            primary
                                                                            onClick={handleConfirm}
                                                                        >
                                                                            {i18n.t('Confirm and Send')}
                                                                        </Button>
                                                                    </div>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <span data-test="saving-exchange-loader">
                                        <Loader />
                                    </span>
                                    <Button
                                        style={{
                                            padding: '10px 15px',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            marginTop: '15px',
                                            boxShadow: '0 0 10px #ff4c4c', // glow effect
                                            backgroundColor: '#f44336',
                                            color: '#fff',
                                            transition: '0.3s',
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            )}  */}

                        </div>

                    </div>





                </div>
            )}

            {isDataModalOpen && !isSyncStatusOpen && (
                <div
                    style={{
                        marginTop: '20px',
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '100%',
                        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                    }}
                >


                    <h3>Import Status: {DatamodalData.status}</h3>
                    <p>Message: {DatamodalData.message}</p>
                    <p>Description: {DatamodalData.response.description}</p>

                    <h4>Import Count</h4>
                    <ul>
                        <li>Imported: {DatamodalData.response.importCount.imported}</li>
                        <li>Updated: {DatamodalData.response.importCount.updated}</li>
                        <li>Ignored: {DatamodalData.response.importCount.ignored}</li>
                        <li>Deleted: {DatamodalData.response.importCount.deleted}</li>
                    </ul>

                    <h4>Other Details</h4>
                    <p>Response Type: {DatamodalData.response.responseType}</p>
                    <p>Data Set Complete: {DatamodalData.response.dataSetComplete === "false" ? "No" : "Yes"}</p>

                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            style={{
                                padding: '10px 15px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                            primary
                            onClick={handleCloseDataModal}
                        >
                            {i18n.t('Close')}
                        </Button>
                    </div>
                </div>

            )}

            {isSyncStatusOpen && (
                <div
                    style={{
                        marginTop: '20px',
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '100%',
                        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                    }}
                >


                    <h3>Test: {statusData.dataSet}</h3>
                    <p>Complete Date : {statusData.completeDate}</p>



                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            style={{
                                padding: '10px 15px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                            primary
                            onClick={handleCloseDataModal}
                        >
                            {i18n.t('Close')}
                        </Button>
                    </div>
                </div>

            )}



        </>
    );
};



ExchangeForm.propTypes = {
    addMode: PropTypes.bool,
    exchangeInfo: PropTypes.object,
}