import React, { useCallback } from 'react'

export default function VatCalculationsList(
    {
        loggedIn,
        vatCalculations = [],
        vatCalculationsTotal = 0,
        setVatCalculationsError,
        vatCalculationError
    }
) {

    /* Loads the logged in user's saved VAT calculations for the VAT calculations
    list, as above. */
    const fetchVatCalculations = useCallback(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token /*|| !loggedIn === false*/) return;
        const response = await fetch('http://localhost:3001/vat/history',{
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type':'application/json',
            'Authorization': `Bearer ${token}`,
          }
        })
      } catch (error) {
        
      }
    })
     // Removes one of the user's saved VAT calculations, as above
    const deleteVatCalculation = useCallback(async (calculationId) => {
      try {
        const token = localStorage.getItem('token');
        if (!token /*|| !loggedIn === false*/) return;
        const response = await fetch(`http://localhost:3001/vat/delete/${calculationId}`,{
          method: 'DELETE',
          mode: 'cors',
           headers: {
            'Content-Type':'application/json',
            'Authorization': `Bearer ${token}`,
          }
        })
      } catch (error) {
        
      }
    },[])
  return (
    <div>VatCalculationsList</div>
  )
}
