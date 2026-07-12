# -*- coding: utf-8 -*-
from odoo import models, fields, api

class HRDepartment(models.Model):
    _inherit = 'hr.department'

    esg_score = fields.Float(string='ESG Score', default=70.0, group_operator='avg')
    environmental_score = fields.Float(string='Environmental Score', default=70.0, group_operator='avg')
    social_score = fields.Float(string='Social Score', default=70.0, group_operator='avg')
    governance_score = fields.Float(string='Governance Score', default=70.0, group_operator='avg')
    
    target_carbon = fields.Float(string='Annual Carbon Budget (tCO2e)', default=250.0)
    current_carbon = fields.Float(string='Current Carbon Emissions (tCO2e)', compute='_compute_current_carbon', store=True)

    carbon_transaction_ids = fields.One2many(
        'ecosphere.carbon.transaction', 'department_id', string='Carbon Transactions'
    )
    sustainability_goal_ids = fields.One2many(
        'ecosphere.sustainability.goal', 'department_id', string='Sustainability Goals'
    )

    @api.depends('carbon_transaction_ids', 'carbon_transaction_ids.carbon_emission', 'carbon_transaction_ids.status')
    def _compute_current_carbon(self):
        for dept in self:
            posted_txs = dept.carbon_transaction_ids.filtered(lambda t: t.status == 'posted')
            dept.current_carbon = sum(posted_txs.mapped('carbon_emission'))


class HREmployee(models.Model):
    _inherit = 'hr.employee'

    xp_points = fields.Integer(string='Sustainability XP', default=100)
    sustainability_score = fields.Float(string='Sustainability Engagement Score', default=65.0)
    
    badge_ids = fields.Many2many(
        'ecosphere.badge', 
        'employee_badge_rel', 
        'employee_id', 
        'badge_id', 
        string='Sustainability Badges'
    )
    
    carbon_footprint = fields.Float(string='Personal Carbon Footprint (tCO2e)', compute='_compute_carbon_footprint', store=True)

    carbon_transaction_ids = fields.One2many(
        'ecosphere.carbon.transaction', 'employee_id', string='Carbon Contributions'
    )
    csr_participation_ids = fields.One2many(
        'ecosphere.csr.participation', 'employee_id', string='CSR Activities'
    )
    policy_ack_ids = fields.One2many(
        'ecosphere.policy.acknowledgement', 'employee_id', string='Policy Acknowledgements'
    )
    compliance_issue_ids = fields.One2many(
        'ecosphere.compliance.issue', 'owner_id', string='Assigned Compliance Issues'
    )

    @api.depends('carbon_transaction_ids', 'carbon_transaction_ids.carbon_emission', 'carbon_transaction_ids.status')
    def _compute_carbon_footprint(self):
        for emp in self:
            posted_txs = emp.carbon_transaction_ids.filtered(lambda t: t.status == 'posted')
            emp.carbon_footprint = sum(posted_txs.mapped('carbon_emission'))
