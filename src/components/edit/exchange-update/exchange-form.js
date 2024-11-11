import i18n from '@dhis2/d2-i18n'
import { Box, NoticeBox, ReactFinalForm, Modal, Button } from '@dhis2/ui'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
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

    const [isDataModalOpen, setDataModalOpen] = useState(false);
    const [DatamodalData, setDataModalData] = useState([]); 

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleCloseDataModal = () => {
        setDataModalOpen(false);
    };

    const handleConfirm = async () => {
       
            const values =modalData.values;
            const requests = modalData.requestsState
            const dataValues = getExchangeValuesFromForm({
                values,
                requests,
            });
            const pe = dataValues?.source?.requests[0]?.peInfo[0].id
            const targetUrl = dataValues?.target?.api.url
            const username = dataValues?.target?.api.username
            const password = dataValues?.target?.api.password
            const accessToken =dataValues?.target?.api.accessToken
            const request = dataValues?.source?.requests[0];
            const dx = request?.dx.join(';'); 
            const ou = request?.ou.join(';'); 
            const periodData = request?.peInfo;
            const startDate = periodData[0].startDate;
            const endDate = periodData[0].endDate;
            const baseUrl = config.baseUrl;            

            const endpoint = '/api/analytics.json';
            const url = `${baseUrl}${endpoint}?dimension=dx:${dx}&dimension=ou:${ou}&startDate=${startDate}&endDate=${endDate}&outputOrgUnitIdScheme=ATTRIBUTE:tL7ErP7HBel&outputIdScheme=ATTRIBUTE:b8KbU93phhz`;
            const fetchResponse = await fetch(url);
            if (fetchResponse.ok) {
                const fetchedData = await fetchResponse.json();
                const urlEndpoint = `${baseUrl}/api/programIndicators/${dx}`
                const comboOptionResponse = await fetch(urlEndpoint);
                const comboOptionData =  await comboOptionResponse.json();
                const categoryOptionComboId =comboOptionData.aggregateExportCategoryOptionCombo;
                const payload = {
                    dataValues: fetchedData.rows.map(row => ({
                        dataElement: row[0],
                        period: pe,  
                        orgUnit: row[1],
                        value: parseInt(row[2]), 
                        categoryOptionCombo:categoryOptionComboId
                    })),
                };
              if(username && password){
                 const response = await fetch(`${targetUrl}api/dataValueSets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + btoa(`${username}:${password}`) 
                    },
                    body: JSON.stringify(payload),
                });
                if(response){
                    const data = await response.json();
                    setDataModalData(data);
                    setModalOpen(false);
                    setDataModalOpen(true);
                }
                return response.ok
                    ? console.log('Data sent successfully:')
                    : console.error('Error sending data:', response.statusText);
            }
            else{

                const response = await fetch(`${targetUrl}api/dataValueSets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'ApiToken ' + accessToken
                    },
                    body: JSON.stringify(payload),
                });
                if(response){
                    const data = await response.json();
                    setDataModalData(data);
                    setModalOpen(false);
                    setDataModalOpen(true);
                }
                return response.ok
                    ? console.log('Data sent successfully:')
                    : console.error('Error sending data:', response.statusText);
            }
         
        }
    };

    return (
        <>
            <Form
                onSubmit={async (values, form) => {
                    try {                        
                        const response = await saveExchange({
                            values,
                            form,
                            id: exchangeInfo?.id,
                            requests: requestsState,
                            requestsTouched,
                            newExchange: addMode,
                        });
                        if (response) {
                            const formattedData = response.rows.map(row => ({
                                name: response.metaData.items[row[0]]?.name ,
                                orgUnit:response.metaData.items[row[1]]?.name,
                                total: row[2],
                            }));
                            const combinedData = {
                                formattedData,
                                values,         
                                requestsState,  
                            };
                            setModalData(combinedData); 
                            setModalOpen(true); 
                        }
                    } catch (err) {
                        console.error('Failed to save exchange:', err);
                    }
                }}
                initialValues={getInitialValuesFromExchange({ exchangeInfo })}
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
                                    {/* <EditTitle
                                        title={
                                            addMode
                                                ? 'Add exchange'
                                                : 'Edit exchange'
                                        }
                                    /> */}

                                    <div className={styles.editFormArea}>
                                        {saving && (
                                            <span data-test="saving-exchange-loader">
                                                <Loader />
                                            </span>
                                        )}
                                        {error && (
                                            <NoticeBox
                                                error
                                                title="Could not save"
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

            {isModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '80%',
                            maxWidth: '600px',
                            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                            overflowY: 'scroll',
                            maxHeight: '90vh',
                        }}
                    >
                        {/* Check if modalData.formattedData exists and has length */}
                        {modalData?.formattedData?.length > 0 ? (
                            Object.entries(
                                modalData.formattedData.reduce((acc, data) => {
                                    if (!acc[data.orgUnit]) {
                                        acc[data.orgUnit] = [];
                                    }
                                    acc[data.orgUnit].push(data);
                                    return acc;
                                }, {})
                            ).map(([orgUnit, records], orgIndex) => (
                                <div key={orgIndex} style={{ marginBottom: '20px' }}>
                                    <h3>{orgUnit}</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>S.N</th>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {records.map((data, index) => (
                                                <tr key={index}>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{index + 1}</td>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{data.name}</td>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{data.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        ) : (
                            <div><strong>No data found</strong></div>
                        )}


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
                                {i18n.t('Confirm')}
                            </Button>
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
                                {i18n.t('Close')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            {isDataModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '80%',
                            maxWidth: '600px',
                            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                            overflowY: 'scroll',
                            maxHeight: '90vh',
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
                </div>
            )}



        </>
    );
};



ExchangeForm.propTypes = {
    addMode: PropTypes.bool,
    exchangeInfo: PropTypes.object,
}
