# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class SustainabilityChallenge(models.Model):
    _name = 'ecosphere.challenge'
    _description = 'Sustainability Challenge'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Challenge Name', required=True)
    category = fields.Selection([
        ('cycle_to_work', 'Cycle to Work'),
        ('paperless', 'Paperless Office Week'),
        ('energy_saving', 'Energy Saving Month'),
        ('zero_waste', 'Zero Waste Challenge')
    ], string='Challenge Type', required=True, default='cycle_to_work')
    description = fields.Text(string='Objectives & Description')
    start_date = fields.Date(string='Start Date', required=True)
    end_date = fields.Date(string='End Date', required=True)
    xp_reward = fields.Integer(string='XP Reward Pool', default=100)
    
    status = fields.Selection([
        ('draft', 'Drafting'),
        ('active', 'Active Challenge'),
        ('review', 'Under Evaluation'),
        ('completed', 'Finished / Completed'),
        ('archived', 'Archived')
    ], string='Status', default='draft', tracking=True)

    participation_ids = fields.One2many(
        'ecosphere.challenge.participation', 'challenge_id', string='Participants'
    )
    participant_count = fields.Integer(string='Joined', compute='_compute_participant_count')

    @api.depends('participation_ids')
    def _compute_participant_count(self):
        for ch in self:
            ch.participant_count = len(ch.participation_ids)

    def action_activate(self):
        for ch in self:
            ch.status = 'active'

    def action_close(self):
        for ch in self:
            ch.status = 'review'

    def action_complete(self):
        for ch in self:
            ch.status = 'completed'
            # Reward XP to all employees who completed the challenge successfully
            completers = ch.participation_ids.filtered(lambda p: p.status == 'completed')
            for part in completers:
                part.employee_id.xp_points += ch.xp_reward
                # Improve engagement score
                part.employee_id.sustainability_score = min(100.0, part.employee_id.sustainability_score + 8.0)


class ChallengeParticipation(models.Model):
    _name = 'ecosphere.challenge.participation'
    _description = 'Challenge Participation Entry'

    employee_id = fields.Many2one('hr.employee', string='Employee', required=True, ondelete='cascade')
    challenge_id = fields.Many2one('ecosphere.challenge', string='Challenge', required=True, ondelete='cascade')
    status = fields.Selection([
        ('joined', 'Joined'),
        ('completed', 'Target Achieved'),
        ('failed', 'Incomplete')
    ], string='Outcome Status', default='joined')

    def action_mark_completed(self):
        for part in self:
            part.status = 'completed'


class Badge(models.Model):
    _name = 'ecosphere.badge'
    _description = 'EcoSphere Sustainability Badge'

    name = fields.Char(string='Badge Title', required=True)
    description = fields.Text(string='Criteria to unlock')
    badge_type = fields.Selection([
        ('eco_warrior', 'Eco Warrior'),
        ('carbon_hero', 'Carbon Hero'),
        ('green_leader', 'Green Leader'),
        ('planet_protector', 'Planet Protector'),
        ('net_zero_champion', 'Net Zero Champion')
    ], string='Symbolic Class', required=True, default='eco_warrior')
    image_logo = fields.Binary(string='Badge Icon')


class RewardMarketplace(models.Model):
    _name = 'ecosphere.reward.marketplace'
    _description = 'Sustainability Reward Marketplace'

    name = fields.Char(string='Reward Name', required=True)
    cost_xp = fields.Integer(string='XP Cost to Redeem', required=True, default=100)
    description = fields.Text(string='Reward Benefits')
    stock = fields.Integer(string='Available Stock', default=10)
    status = fields.Selection([
        ('available', 'Available'),
        ('out_of_stock', 'Out of Stock')
    ], string='Status', default='available', compute='_compute_status', store=True)

    @api.depends('stock')
    def _compute_status(self):
        for reward in self:
            if reward.stock <= 0:
                reward.status = 'out_of_stock'
            else:
                reward.status = 'available'


class RewardRedemption(models.Model):
    _name = 'ecosphere.reward.redemption'
    _description = 'Employee Reward Redemption Ledger'
    _inherit = ['mail.thread']

    employee_id = fields.Many2one('hr.employee', string='Employee', required=True)
    reward_id = fields.Many2one('ecosphere.reward.marketplace', string='Reward Item', required=True)
    date_redeemed = fields.Datetime(string='Redeemed Date', default=fields.Datetime.now)
    status = fields.Selection([
        ('pending', 'Under Review'),
        ('delivered', 'Delivered')
    ], string='Delivery Status', default='pending', tracking=True)

    @api.model
    def create(self, vals):
        employee = self.env['hr.employee'].browse(vals.get('employee_id'))
        reward = self.env['ecosphere.reward.marketplace'].browse(vals.get('reward_id'))
        
        if reward.stock <= 0:
            raise UserError(_("Reward item is currently out of stock!"))
            
        if employee.xp_points < reward.cost_xp:
            raise UserError(_("Insufficient Sustainability XP points to redeem %s. Requires %d XP, employee has %d XP.") % 
                            (reward.name, reward.cost_xp, employee.xp_points))
        
        # Deduct XP immediately
        employee.xp_points -= reward.cost_xp
        # Deduct Stock
        reward.stock -= 1
        
        # Log to activity feed
        res = super(RewardRedemption, self).create(vals)
        res.message_post(body=_("Redemption request registered: -%d XP from employee balance.") % reward.cost_xp)
        return res

    def action_deliver(self):
        for red in self:
            red.status = 'delivered'
