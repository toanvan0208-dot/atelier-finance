import { fetchLocalPythonVnstockHistory } from '../src/lib/data-sources/vnstock-market-pvt-controlled-ingestion';
fetchLocalPythonVnstockHistory({ticker: 'FPT', from: '2025-06-20', to: '2025-06-25'}).then(r => console.log(r[0]));
