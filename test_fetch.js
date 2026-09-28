import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testFetch() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = token.split('_')[3].toLowerCase();
  console.log('Store ID:', storeId);
  const url = `https://${storeId}.public.blob.vercel-storage.com/dummy.jpg`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Status:', response.status);
}

testFetch();
