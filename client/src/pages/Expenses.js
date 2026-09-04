import React, { useState } from 'react'
import '../css/pagesCss/Expenses.css'
import '../css/pagesCss/PageSetup.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import AddExpenseForm from '../components/AddExpenseForm';

export default function Expenses({currentUser, logout}) {
    const [showAddExp, setShowAddExp] = useState(false)

    const toggleAddExpForm = () => {setShowAddExp(prev => (!prev))}
  return (
    <div id='pageContainer'>
        <Header currentUser={currentUser} heading={'EXPENSES'}/>
            <section id='expensesSection1'>
                <div id='exp-section1-panal'>
                    <Row id='toggleExpFormRow'>
        <Col id='toggleExpFormCol1'/>
        <Col xs={5} id='toggleExpFormCol'>
            <div id='toggle-addexp-block'>
                <Button
                variant='light'
                id='toggleAddExpBtn'
                onClick={toggleAddExpForm}
                type='button'
                aria-controls='add-exp-panal'
                aria-label={showAddExp ? 'Hide Form': 'Add Trip Expense'}
                aria-pressed={showAddExp}
                aria-expanded={showAddExp}
                >
                {showAddExp ? 'Hide Form': 'Add Trip Expense'}
                </Button>
            </div>
        </Col>
        <Col id='toggleExpFormCol2'/>
      </Row>
      {/* TOGGLE ADD EXPENSE FORM */}
      {showAddExp && (
        <div id='add-exp-panal'>
            <Row id='add-expense-row'>
                <Col id='addExpCol1'/>
                <Col xs={12} md={8} id='addExpCol'>
                    <div id='addExp-Form-display'>
                        <AddExpenseForm
                            currentUser={currentUser}
                        />
                    </div>
                </Col>
                <Col id='addExpCol2'/>
            </Row>
        </div>
      )}

                </div>

            </section>
        <Footer logout={logout}/>
    </div>
  )
}
