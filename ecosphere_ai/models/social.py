# -*- coding: utf-8 -*-
from odoo import models, fields, api

class CSRActivity(models.Model):
    _name = 'ecosphere.csr.activity'
    _description = 'CSR Activity'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    title = fields.Char(string='Activity Title', required=True)
    category = fields.Selection([
        ('volunteering', 'Environmental Volunteering'),
        ('community', 'Community Development'),
        ('education', 'Sustainability Education'),
        ('charity', 'Eco-Charity Drive')
    ], string='CSR Category', required=True, default='volunteering')
    description = fields.Text(string='Description')
    date = fields.Date(string='Scheduled Date', required=True)
    budget = fields.Float(string='Allocated Budget ($)', default=0.0)
    points_reward = fields.Integer(string='XP Reward on Completion', default=50)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('open', 'Open for Registration'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='draft', tracking=True)

    participation_ids = fields.One2many(
        'ecosphere.csr.participation', 'activity_id', string='Participations'
    )
    participant_count = fields.Integer(string='Participants', compute='_compute_participant_count')

    @api.depends('participation_ids')
    def _compute_participant_count(self):
        for act in self:
            act.participant_count = len(act.participation_ids.filtered(lambda p: p.status == 'approved'))

    def action_open(self):
        for act in self:
            act.status = 'open'

    def action_complete(self):
        for act in self:
            act.status = 'completed'
            # Approve pending participations and give points
            for part in act.participation_ids:
                if part.status == 'draft':
                    part.action_approve()


class CSRParticipation(models.Model):
    _name = 'ecosphere.csr.participation'
    _description = 'CSR Participation Log'
    _inherit = ['mail.thread']

    employee_id = fields.Many2one('hr.employee', string='Employee', required=True)
    activity_id = fields.Many2one('ecosphere.csr.activity', string='CSR Activity', required=True)
    proof = fields.Text(string='Activity Proof / Submission Note')
    points_earned = fields.Integer(string='Points Earned', compute='_compute_points_earned', store=True)
    status = fields.Selection([
        ('draft', 'Registered'),
        ('approved', 'Approved & Credited'),
        ('rejected', 'Rejected')
    ], string='Status', default='draft', tracking=True)

    @api.depends('status', 'activity_id.points_reward')
    def _compute_points_earned(self):
        for part in self:
            if part.status == 'approved' and part.activity_id:
                part.points_earned = part.activity_id.points_reward
            else:
                part.points_earned = 0

    def action_approve(self):
        for part in self:
            if part.status != 'approved':
                part.status = 'approved'
                # Reward XP to employee
                part.employee_id.xp_points += part.activity_id.points_reward
                # Recalculate employee sustainability engagement score
                part.employee_id.sustainability_score = min(100.0, part.employee_id.sustainability_score + 5.0)

    def action_reject(self):
        for part in self:
            part.status = 'rejected'


class SustainabilityTraining(models.Model):
    _name = 'ecosphere.sustainability.training'
    _description = 'Sustainability Training Course'

    name = fields.Char(string='Course Title', required=True)
    duration_hours = fields.Float(string='Duration (Hours)', default=1.0)
    description = fields.Text(string='Course Syllabus')
    active = fields.Boolean(string='Active', default=True)


class TrainingParticipation(models.Model):
    _name = 'ecosphere.training.participation'
    _description = 'Training Completion Tracker'

    employee_id = fields.Many2one('hr.employee', string='Employee', required=True)
    training_id = fields.Many2one('ecosphere.sustainability.training', string='Course', required=True)
    completion_pct = fields.Float(string='Completion %', default=0.0)
    status = fields.Selection([
        ('enrolled', 'Enrolled'),
        ('completed', 'Completed')
    ], string='Status', default='enrolled', compute='_compute_status', store=True)
    certificate_no = fields.Char(string='Certificate Number')
    date_completed = fields.Date(string='Completion Date')

    @api.depends('completion_pct')
    def _compute_status(self):
        for rec in self:
            if rec.completion_pct >= 100.0:
                rec.status = 'completed'
                if not rec.date_completed:
                    rec.date_completed = fields.Date.context_today(rec)
            else:
                rec.status = 'enrolled'
