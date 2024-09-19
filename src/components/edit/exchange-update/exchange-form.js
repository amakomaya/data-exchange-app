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

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleConfirm = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/endpoint`, { // Update endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(modalData), // Sending modalData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Data sent successfully:', result);
                handleCloseModal();
            } else {
                console.error('Error sending data');
            }
        } catch (error) {
            console.error('Failed to send data:', error);
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
                            setModalData(formattedData); 
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
                        <div className={styles.fullHeight}>
                            <div className={styles.editArea}>
                                <div
                                    className={styles.editContainer}
                                    data-test="add-exchange-title"
                                >
                                    <EditTitle
                                        title={
                                            addMode
                                                ? 'Add exchange'
                                                : 'Edit exchange'
                                        }
                                    />

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
                        {Object.entries(
                            modalData.reduce((acc, data) => {
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
                        ))}

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

        </>
    );
};



ExchangeForm.propTypes = {
    addMode: PropTypes.bool,
    exchangeInfo: PropTypes.object,
}
