export const ok = (data) => ({
  statusCode: 200,
  body: JSON.stringify(data)
});

export const badRequest = (error) => ({
  statusCode: 400,
  body: JSON.stringify({ error: error.message || error })
});

export const internalServerError = (error) => ({
  statusCode: 500,
  body: JSON.stringify({ 
    error: error.message || 'Internal server error',
    details: error.details
  })
});

