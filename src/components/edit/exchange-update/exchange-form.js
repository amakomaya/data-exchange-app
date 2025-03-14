import i18n from '@dhis2/d2-i18n'
import { Box, NoticeBox, ReactFinalForm, Modal, Button} from '@dhis2/ui'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React, { useCallback, useState,useEffect } from 'react'
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


import { useUpdateExchange } from './useUpdateExchange.js'

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
    const [peInfo, setPeInfo] = useState('');
    const [period, setPeriod] = useState('');
    const [orgUnit, setorgUnit] = useState('');
    const [err, setError] = useState('');
    const [showError, setShowError] = useState(!!error);


    const handleRowClick = (id) => {
        setSelectedDataset(id)
        setIsLoading(true); 

        fetchDatasetDetails();
        
    };
    
    const fetchDatasetDetails = async () => {

        if (!selectedDataset) return;
        try {
            const baseUrl = config.baseUrl;            
            const programIndicatorsEndpoint = '/api/programIndicators';

            const programIndicatorsUrl = `${baseUrl}${programIndicatorsEndpoint}?filter=attributeValues.value:eq:${selectedDataset}`;
            const programIndicatorsData = await fetch(programIndicatorsUrl);
             if (programIndicatorsData.ok) {
                const fetchedprogramIndicatorsData = await programIndicatorsData.json();
                const dx = fetchedprogramIndicatorsData?.programIndicators.map(data => data.id).join(';');
                const id = fetchedprogramIndicatorsData?.programIndicators.map(data => data.id).join(','); 
                const values =modalData.values;
                const requests = modalData.requestsState
                const formattedValues = getExchangeValuesFromForm({
                    values,
                    requests,
                });
                let targetUrl = formattedValues?.target?.api.url
                if (targetUrl && !targetUrl.endsWith('/')) {
                    targetUrl += '/';
                }
                const username = formattedValues?.target?.api.username
                const password = formattedValues?.target?.api.password
                const accessToken =formattedValues?.target?.api.accessToken
                const request = formattedValues?.source?.requests[0];
                const ou = request?.ou.join(';'); 
                const periodData = request?.peInfo;
                const peInfo = periodData[0].id;
                setPeInfo(peInfo); 
                const startDate = periodData[0].startDate;
                const endDate = periodData[0].endDate;
                const analyticsUrl = `${baseUrl}/api/analytics.json?dimension=dx:${dx}&dimension=ou:${ou}&startDate=${startDate}&endDate=${endDate}&outputOrgUnitIdScheme=ATTRIBUTE:tL7ErP7HBel`;
                const orgUnit =  request?.ouInfo.map(({ name }) => name).join(', ')
                const period = periodData.map(({ name }) => name).join(', ')
                setPeriod(period)
                setorgUnit(orgUnit)
            
                if(dx.length>0){
                    const analyticsData = await fetch(analyticsUrl);
                    if (analyticsData.ok) {
                        const fetchedAnalyticsData = await analyticsData.json(); 
                        const rows = fetchedAnalyticsData.rows;
                        setAnalyticsRows(rows); 
                        const comboIdUrl = `${baseUrl}${programIndicatorsEndpoint}?filter=id:in:[${id}]&fields=id,name,aggregateExportCategoryOptionCombo,attributeValues`;
                        const comboIdData = await fetch(comboIdUrl);
                        const fetchedcomboIdData = await comboIdData.json();
                        const programIndicators = fetchedcomboIdData.programIndicators;
                        const categoryOptionCombos = programIndicators.map(indicator => indicator.aggregateExportCategoryOptionCombo);
                        setCategoryOptionCombos(categoryOptionCombos); 
                        const reportUrl = `${baseUrl}/api/sqlViews/MqE87cFhgmG/data?criteria=organisationunituid:${ou}&filter=occurreddate:ge:${startDate}&filter=occurreddate:le:${endDate}&paging=false`;
                        const reportData = await fetch(reportUrl);
                        const fetchedreportData = await reportData.json();
                        const reportRows = fetchedreportData.listGrid.rows;
                        let counters = {};
                        
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
                            "1-10_14_YEARS-female":"HscG3R78Jzc-ciTvZ1HjQTw-val",
                            "1-10_14_YEARS-male":"HscG3R78Jzc-SDgsEKTs0IH-val",
                            "1-15_19_YEARS-female":"HscG3R78Jzc-RnH2ZpATWSI-val",
                            "1-15_19_YEARS-male":"HscG3R78Jzc-ffNSZ7u5Y5P-val",
                            "1-20_59_YEARS-female":"HscG3R78Jzc-sfmUgn8yywu-val",
                            "1-20_59_YEARS-male":"HscG3R78Jzc-iUcXHCikw4W-val",
                            "1-60_69_YEARS-female":"HscG3R78Jzc-COAFy42YNLg-val",
                            "1-60_69_YEARS-male":"HscG3R78Jzc-D7tJYC2XYrC-val",
                            "1-GREATER_70-female":"HscG3R78Jzc-M0yrPwi8vEK-val",
                            "1-GREATER_70-male":"HscG3R78Jzc-DYUdGTQhgf9-val",

                            "yes-0_9_YEARS-female":"ZNYzRQGhxpd-I1gylzOskBs-val",
                            "yes-0_9_YEARS-male":"ZNYzRQGhxpd-TTNFd2X49S6-val",
                            "yes-10_14_YEARS-female":"ZNYzRQGhxpd-ciTvZ1HjQTw-val",
                            "yes-10_14_YEARS-male":"ZNYzRQGhxpd-SDgsEKTs0IH-val",
                            "yes-15_19_YEARS-female":"ZNYzRQGhxpd-RnH2ZpATWSI-val",
                            "yes-15_19_YEARS-male":"ZNYzRQGhxpd-ffNSZ7u5Y5P-val",
                            "yes-20_59_YEARS-female":"ZNYzRQGhxpd-sfmUgn8yywu-val",
                            "yes-20_59_YEARS-male":"ZNYzRQGhxpd-iUcXHCikw4W-val",
                            "yes-60_69_YEARS-female":"ZNYzRQGhxpd-COAFy42YNLg-val",
                            "yes-60_69_YEARS-male":"ZNYzRQGhxpd-D7tJYC2XYrC-val",
                            "yes-GREATER_70-female":"ZNYzRQGhxpd-M0yrPwi8vEK-val",
                            "yes-GREATER_70-male":"ZNYzRQGhxpd-DYUdGTQhgf9-val"
                        };  
                     
                   
                        reportRows.forEach(row => {
                            let [trackedentityid, programstageid, occurreddate, organisationunituid, old_new_value, referred_value,age_group, gender, age_gender] = row;
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
                        let result = {};
                        rows.forEach(row => {
                            const [value, orgunitID, rowValue] = row;
                            
                            programIndicators.forEach(indicator => {
                                const matchingAttribute = indicator.id;
                                const matchingAttributeId = indicator.attributeValues.find(attribute => attribute.attribute.id === "b8KbU93phhz");
                                if (matchingAttribute === value) {
                                    const key = `${matchingAttributeId.value}-${indicator.aggregateExportCategoryOptionCombo}-val`;
                                    result[key] = rowValue; 
                                }
    
                            });
                        });
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
                else{
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

                        
                                    return updatedHtml;
                                }
                        
                                return '';
                            });
                            const combinedHtml =  HtmlCode.join('') + '<p><strong>No data found</strong></p>' 

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
                            const combinedHtml =  HtmlCode.join('') + '<p><strong>No data found</strong></p>' 
                        
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

    };

    const handleConfirm = async () => {
        try {
            setError('')
            setShowError(false);
            setIsLoading(true); 
            const { values, requestsState } = modalData;
            const dataValues = getExchangeValuesFromForm({ values, requests: requestsState });
            const baseUrl = config.baseUrl;            
            let targetUrl = dataValues?.target?.api.url;
            const username = dataValues?.target?.api.username;
            const password = dataValues?.target?.api.password;
            const accessToken = dataValues?.target?.api.accessToken;
            if (targetUrl && !targetUrl.endsWith('/')) {
                targetUrl += '/';
            }
            let orgUnitID = null;
            analyticsRows.forEach((row) => {
                orgUnitID = row[1];
            });
    
            const orgUnitResponse = await fetch(`${baseUrl}/api/organisationUnits/${orgUnitID}`, {
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
    
            const payload = {
                dataSet: selectedDataset,
                orgUnitIdScheme: 'code',
                dataValues: analyticsRows.map(([dataElement, orgUnit, rowValue], index) => ({
                    dataElement,
                    orgUnit:orgUnitCode,
                    period: peInfo,
                    categoryOptionCombo: categoryOptionCombos[index],
                    value: parseInt(rowValue, 10),
                })),
            };
    
            let dataValueResponse;
            if (username && password) {
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
         {!isModalOpen  && !isDataModalOpen &&(
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
                            const datasetData = response.dataSets;
                              const combinedData = {
                                datasetData,
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
                                        {/* {err && showError && (
                                        <NoticeBox
                                            error
                                            title="Error"
                                            className={
                                                styles.errorBoxContainer
                                            }
                                        >
                                            {err.message}
                                        </NoticeBox>
                                    )} */}
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
                                    requestsState ={requestsState}
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
            
            {isModalOpen && !isDataModalOpen &&(
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
                            <p>Could not send data</p>
                        </NoticeBox>
                    )}

                    {err && showError && (() => {
                        setTimeout(() => handleClearError(), 2000);
                        return null; 
                    })()}

                    {isLoading &&( 
                        <span>
                            <Loader />
                        </span>
                                            
                    
                 )}
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
                    <h3>Select a Program</h3>
                    <div style={{display:'flex'}}>
                        <table
                            style={{
                                width: '300px',
                                height:'400px',
                                borderCollapse: 'collapse',
                                marginBottom: '20px',
                                float:'left',
                                overflowX:'auto'
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            padding: '10px',
                                            border: '1px solid #ccc',
                                            textAlign: 'center',
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
                                            backgroundColor:selectedDataset === id ? '#d0e6ff' : 'white', 
                                            
                                        }}
                                        onClick={() => handleRowClick(id)}    
                                        message
                                        >
                                        <td
                                            style={{
                                                padding: '10px',
                                                border: '1px solid #ccc',
                                            }}

                                        >
                                       {displayName} 
                                        </td>
                                        
                                    </tr>
                                ))}

                            </tbody>
                        </table>

                    
                            <div style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                marginBottom: '20px',
                                marginLeft:'50px',
                                float:'right',
                                overflowX:'auto'
                            }}>
                                {datasetDetails && (
                                            <div>
                                                <p><strong>Organization Unit:{orgUnit}</strong></p>
                                                <p><strong>Periods:{period}</strong></p>

                                                <div dangerouslySetInnerHTML={{ __html: datasetDetails }} />
                                            </div>
                                        )}

                            </div>
                    </div>


              
                   

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
            )}
           
            {isDataModalOpen && (
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



        </>
    );
};



ExchangeForm.propTypes = {
    addMode: PropTypes.bool,
    exchangeInfo: PropTypes.object,
}
