import { Router } from 'express';
import { query } from '../db/db.js';

const router = Router();

router.get('/pricing', async (req, res) => {
  try {
    const result = await query('SELECT * FROM pricing_plans ORDER BY price ASC');
    const plans = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      originalPrice: row.original_price,
      period: row.period,
      description: row.description,
      isOnSale: row.is_on_sale,
      saleReason: row.sale_reason,
      saleEnds: row.sale_ends,
    }));
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

router.post('/pricing', async (req, res) => {
  try {
    const plans = req.body.pricing || req.body;
    if (!Array.isArray(plans)) {
      return res.status(400).json({ error: 'pricing must be an array' });
    }

    for (const plan of plans) {
      await query(
        `
        INSERT INTO pricing_plans (id, name, price, original_price, period, description, is_on_sale, sale_reason, sale_ends, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          period = EXCLUDED.period,
          description = EXCLUDED.description,
          is_on_sale = EXCLUDED.is_on_sale,
          sale_reason = EXCLUDED.sale_reason,
          sale_ends = EXCLUDED.sale_ends,
          updated_at = CURRENT_TIMESTAMP
      `,
        [
          plan.id,
          plan.name,
          plan.price,
          plan.originalPrice,
          plan.period,
          plan.description,
          plan.isOnSale,
          plan.saleReason,
          plan.saleEnds,
        ]
      );
    }

    res.json({ ok: true, message: 'Pricing saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save pricing' });
  }
});

router.get('/tiers', async (req, res) => {
  try {
    const result = await query('SELECT * FROM custom_tiers ORDER BY min_users ASC');
    const tiers = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      minUsers: row.min_users,
      maxUsers: row.max_users,
      pricePerUser: row.price_per_user,
    }));
    res.json(tiers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tiers' });
  }
});

router.post('/tiers', async (req, res) => {
  try {
    const tiers = req.body.tiers || req.body;
    if (!Array.isArray(tiers)) {
      return res.status(400).json({ error: 'tiers must be an array' });
    }

    for (const tier of tiers) {
      await query(
        `
        INSERT INTO custom_tiers (id, name, min_users, max_users, price_per_user)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          min_users = EXCLUDED.min_users,
          max_users = EXCLUDED.max_users,
          price_per_user = EXCLUDED.price_per_user
      `,
        [tier.id, tier.name, tier.minUsers, tier.maxUsers, tier.pricePerUser]
      );
    }

    res.json({ ok: true, message: 'Tiers saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save tiers' });
  }
});

export default router;
