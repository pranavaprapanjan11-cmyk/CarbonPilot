# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request

class EcoSphereController(http.Controller):

    @http.route('/ecosphere/esg_summary', type='json', auth='user', methods=['POST'], csrf=False)
    def get_esg_summary(self, **kw):
        """
        Secure RPC route returning corporate ESG scoring aggregates 
        by department, carbon usage, and target metrics.
        """
        departments = request.env['hr.department'].search([])
        summary = []
        for dept in departments:
            summary.append({
                'id': dept.id,
                'name': dept.name,
                'esg_score': dept.esg_score,
                'environmental_score': dept.environmental_score,
                'social_score': dept.social_score,
                'governance_score': dept.governance_score,
                'current_carbon': dept.current_carbon,
                'target_carbon': dept.target_carbon
            })
        return {
            'status': 'success',
            'company_avg_esg': sum(d['esg_score'] for d in summary) / len(summary) if summary else 70.0,
            'departments': summary
        }
