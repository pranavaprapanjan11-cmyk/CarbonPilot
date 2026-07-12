# -*- coding: utf-8 -*-
from odoo import models, fields, api

class ESGPolicy(models.Model):
    _name = 'ecosphere.policy'
    _description = 'ESG Policy Document'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(string='Policy Name', required=True)
    category = fields.Selection([
        ('environmental', 'Environmental Standards'),
        ('social', 'Social & Labor Rights'),
        ('governance', 'Governance & Anti-Corruption'),
        ('code_of_conduct', 'Business Code of Conduct')
    ], string='Policy Category', required=True, default='environmental')
    version = fields.Char(string='Version Label', required=True, default='1.0')
    content = fields.Text(string='Policy Content/Details')
    date_published = fields.Date(string='Published Date', default=fields.Date.context_today)
    date_expiry = fields.Date(string='Expiry Date')
    
    status = fields.Selection([
        ('draft', 'Draft Review'),
        ('active', 'Active Policy'),
        ('expired', 'Archived / Expired')
    ], string='Status', default='draft', tracking=True)

    acknowledgement_ids = fields.One2many(
        'ecosphere.policy.acknowledgement', 'policy_id', string='Employee Acknowledgements'
    )
    ack_percentage = fields.Float(string='Acknowledgement Rate %', compute='_compute_ack_percentage')

    @api.depends('acknowledgement_ids', 'acknowledgement_ids.status')
    def _compute_ack_percentage(self):
        for policy in self:
            total = len(policy.acknowledgement_ids)
            if total > 0:
                accepted = len(policy.acknowledgement_ids.filtered(lambda a: a.status == 'accepted'))
                policy.ack_percentage = (accepted / total) * 100.0
            else:
                policy.ack_percentage = 0.0

    def action_activate(self):
        for policy in self:
            policy.status = 'active'
            # Instantly create pending acknowledgements for all active employees
            employees = self.env['hr.employee'].search([('active', '=', True)])
            ack_vals = []
            for emp in employees:
                # Check if already exists
                existing = self.env['ecosphere.policy.acknowledgement'].search([
                    ('employee_id', '=', emp.id),
                    ('policy_id', '=', policy.id)
                ])
                if not existing:
                    ack_vals.append({
                        'employee_id': emp.id,
                        'policy_id': policy.id,
                        'status': 'pending'
                    })
            if ack_vals:
                self.env['ecosphere.policy.acknowledgement'].create(ack_vals)


class PolicyAcknowledgement(models.Model):
    _name = 'ecosphere.policy.acknowledgement'
    _description = 'Employee Policy Acknowledgement'
    _order = 'id desc'

    employee_id = fields.Many2one('hr.employee', string='Employee', required=True, ondelete='cascade')
    policy_id = fields.Many2one('ecosphere.policy', string='Policy', required=True, ondelete='cascade')
    date_acknowledged = fields.Datetime(string='Date Acknowledged')
    status = fields.Selection([
        ('pending', 'Action Pending'),
        ('accepted', 'Accepted')
    ], string='Status', default='pending')

    def action_accept(self):
        for ack in self:
            ack.status = 'accepted'
            ack.date_acknowledged = fields.Datetime.now()
            # Give the employee small XP for reading policies
            ack.employee_id.xp_points += 10


class ESGAudit(models.Model):
    _name = 'ecosphere.audit'
    _description = 'ESG Audit Log'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Audit ID/Ref', required=True, default='New')
    auditor = fields.Char(string='Lead Auditor Name', required=True)
    audit_date = fields.Date(string='Audit Execution Date', required=True)
    scope = fields.Selection([
        ('all', 'Full ESG Framework'),
        ('carbon', 'Carbon & Resource Utilization'),
        ('social', 'CSR & Labor Standards'),
        ('governance', 'Corporate Controls')
    ], string='Audit Scope', required=True, default='all')
    report_summary = fields.Text(string='Audit Summary / Findings')
    status = fields.Selection([
        ('planned', 'Planned'),
        ('in_progress', 'Audit In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='planned', tracking=True)

    @api.model
    def create(self, vals):
        if vals.get('name', 'New') == 'New':
            vals['name'] = self.env['ir.sequence'].next_by_code('ecosphere.audit') or 'AUDIT-0000'
        return super(ESGAudit, self).create(vals)

    def action_complete(self):
        for audit in self:
            audit.status = 'completed'


class ComplianceIssue(models.Model):
    _name = 'ecosphere.compliance.issue'
    _description = 'Governance Compliance Issue'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'due_date asc, severity desc'

    title = fields.Char(string='Issue Title', required=True)
    severity = fields.Selection([
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('critical', 'Critical / Immediate action')
    ], string='Severity Level', required=True, default='medium', tracking=True)
    owner_id = fields.Many2one('hr.employee', string='Remediation Owner', required=True)
    due_date = fields.Date(string='Due Date', required=True)
    
    status = fields.Selection([
        ('open', 'Open Remediation'),
        ('under_review', 'Review Pending'),
        ('resolved', 'Resolved'),
        ('overdue', 'Overdue')
    ], string='Status', default='open', tracking=True)
    
    resolution_notes = fields.Text(string='Resolution Details')

    def action_resolve(self):
        for issue in self:
            issue.status = 'resolved'
            # Trigger positive impact score increase on resolution
            if issue.owner_id:
                issue.owner_id.xp_points += 40

    def action_review(self):
        for issue in self:
            issue.status = 'under_review'

    @api.model
    def check_overdue_compliance_issues(self):
        """
        Scheduled Cron script to check open issues and mark as overdue.
        """
        today = fields.Date.context_today(self)
        overdue_records = self.search([
            ('status', 'in', ['open', 'under_review']),
            ('due_date', '<', today)
        ])
        if overdue_records:
            overdue_records.write({'status': 'overdue'})
            # We can log this in standard chatter
            for rec in overdue_records:
                rec.message_post(body="System Alert: This compliance issue has exceeded its remediation deadline and is now marked Overdue.")
