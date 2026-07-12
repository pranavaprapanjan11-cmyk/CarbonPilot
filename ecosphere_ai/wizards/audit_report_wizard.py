# -*- coding: utf-8 -*-
from odoo import models, fields, api

class AuditReportWizard(models.TransientModel):
    _name = 'ecosphere.audit.report.wizard'
    _description = 'ESG Audit Summary Wizard'

    date_from = fields.Date(string='Start Date', required=True, default=fields.Date.context_today)
    date_to = fields.Date(string='End Date', required=True, default=fields.Date.context_today)
    department_id = fields.Many2one('hr.department', string='Department Filter')

    def action_print_pdf(self):
        """
        Gathers filters, compiles context details, and returns QWeb PDF report stream.
        """
        self.ensure_one()
        # Look up transactions matching query
        domain = [
            ('date', '>=', self.date_from),
            ('date', '<=', self.date_to),
            ('status', '=', 'posted')
        ]
        if self.department_id:
            domain.append(('department_id', '=', self.department_id.id))
        
        transactions = self.env['ecosphere.carbon.transaction'].search(domain)
        
        # Look up compliance issues during timeframe
        comp_domain = [('due_date', '>=', self.date_from), ('due_date', '<=', self.date_to)]
        if self.department_id:
            comp_domain.append(('owner_id.department_id', '=', self.department_id.id))
        compliance_issues = self.env['ecosphere.compliance.issue'].search(comp_domain)

        data = {
            'form_data': {
                'date_from': self.date_from,
                'date_to': self.date_to,
                'department_name': self.department_id.name if self.department_id else 'All Departments',
            },
            'tx_count': len(transactions),
            'total_emissions': sum(transactions.mapped('carbon_emission')),
            'open_compliance': len(compliance_issues.filtered(lambda i: i.status in ['open', 'overdue'])),
            'resolved_compliance': len(compliance_issues.filtered(lambda i: i.status == 'resolved')),
        }
        
        return self.env.ref('ecosphere_ai.action_report_esg_summary').report_action(self, data=data)
