import { useState } from 'react';
import api from '../api/axios';

const Questions = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/questions/bulk', formData);
      setMessage(res.data.message);
    } catch (err) {
      setMessage('Upload failed');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Bulk Upload Questions</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4"
        />
        <button onClick={handleUpload} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
          Upload CSV
        </button>
        {message && <p className="mt-4 text-green-600">{message}</p>}
      </div>
    </div>
  );
};

export default Questions;