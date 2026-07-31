const getBaseUrl = () => {
        const { protocol, hostname, port } = window.location;
        const portPart = port ? `:${port}` : '';
        return `${protocol}//${hostname}${portPart}`; // for https://erecord.hmis.gov.np/tokha/ only
};

export const config = {
        baseUrl: getBaseUrl(),
        // baseUrl: 'http://localhost:9999',
};