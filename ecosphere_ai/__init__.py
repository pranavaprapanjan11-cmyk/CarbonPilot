# -*- coding: utf-8 -*-
from . import models
from . import wizards
from . import controllers

def post_init_hook(cr, registry):
    """
    Hook to automatically generate rich sample data after module installation.
    Seeds 10 Departments, 100 Employees, 200 Carbon Transactions, 50 CSR Activities,
    50 Compliance Issues, 25 ESG Policies, 25 Goals, 50 Rewards, and 50 Badges.
    """
    from odoo import api, SUPERUSER_ID
    env = api.Environment(cr, SUPERUSER_ID, {})
    
    # Run data seeding script from scoring engine
    if hasattr(env['ecosphere.scoring.engine'], 'seed_demo_data'):
        env['ecosphere.scoring.engine'].seed_demo_data()
