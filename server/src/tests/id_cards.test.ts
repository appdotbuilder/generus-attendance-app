import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { generusTable } from '../db/schema';
import { 
    generateGenerusIDCard, 
    generateIDCardPDF, 
    getIDCardTemplate,
    updateIDCardTemplate,
    validateIDCard,
    getAllIssuedIDCards,
    bulkGenerateIDCards
} from '../handlers/id_cards';
import { eq } from 'drizzle-orm';

describe('ID Cards Handler', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    // Create test generus
    const createTestGenerus = async (overrides = {}) => {
        const result = await db.insert(generusTable).values({
            full_name: 'Test Generus',
            sambung_group: 'Group A',
            level: 'remaja',
            place_of_birth: 'Situbondo',
            date_of_birth: new Date('2000-01-01'),
            gender: 'male',
            status: 'Active',
            profession: 'Student',
            skill: 'Reading',
            is_active: true,
            ...overrides
        }).returning().execute();
        return result[0];
    };

    describe('generateGenerusIDCard', () => {
        it('should generate ID card for valid generus', async () => {
            const generus = await createTestGenerus();
            
            const result = await generateGenerusIDCard(generus.id);

            expect(result.success).toBe(true);
            expect(result.idCard).toBeDefined();
            expect(result.idCard!.generus.id).toBe(generus.id);
            expect(result.idCard!.generus.full_name).toBe('Test Generus');
            expect(result.idCard!.cardNumber).toBe(`GEN${generus.id.toString().padStart(6, '0')}`);
            expect(result.idCard!.qrCode).toMatch(/^data:image\/png;base64,/);
            expect(result.idCard!.issuedDate).toBeInstanceOf(Date);
            expect(result.message).toBe('ID card generated successfully');
        });

        it('should update generus barcode if not set', async () => {
            const generus = await createTestGenerus();
            
            await generateGenerusIDCard(generus.id);

            // Check if barcode was updated in database
            const updated = await db.select()
                .from(generusTable)
                .where(eq(generusTable.id, generus.id))
                .execute();

            expect(updated[0].barcode).toBe(`GEN${generus.id.toString().padStart(6, '0')}`);
        });

        it('should not update barcode if already set', async () => {
            const existingBarcode = 'GEN999999';
            const generus = await createTestGenerus({ barcode: existingBarcode });
            
            const result = await generateGenerusIDCard(generus.id);

            expect(result.success).toBe(true);
            expect(result.idCard!.generus.barcode).toBe(existingBarcode);

            // Verify barcode wasn't changed in database
            const updated = await db.select()
                .from(generusTable)
                .where(eq(generusTable.id, generus.id))
                .execute();

            expect(updated[0].barcode).toBe(existingBarcode);
        });

        it('should fail for non-existent generus', async () => {
            const result = await generateGenerusIDCard(99999);

            expect(result.success).toBe(false);
            expect(result.idCard).toBeUndefined();
            expect(result.message).toBe('Generus not found');
        });

        it('should fail for inactive generus', async () => {
            const generus = await createTestGenerus({ is_active: false });
            
            const result = await generateGenerusIDCard(generus.id);

            expect(result.success).toBe(false);
            expect(result.idCard).toBeUndefined();
            expect(result.message).toBe('Cannot generate ID card for inactive generus');
        });
    });

    describe('generateIDCardPDF', () => {
        it('should generate PDF for valid generus', async () => {
            const generus = await createTestGenerus();
            
            const result = await generateIDCardPDF(generus.id);

            expect(result.success).toBe(true);
            expect(result.pdfUrl).toBe(`/id-cards/generus_${generus.id}_id_card.pdf`);
            expect(result.message).toBe('PDF ID card generated successfully');
        });

        it('should fail for non-existent generus', async () => {
            const result = await generateIDCardPDF(99999);

            expect(result.success).toBe(false);
            expect(result.pdfUrl).toBeUndefined();
            expect(result.message).toBe('Generus not found');
        });

        it('should fail for inactive generus', async () => {
            const generus = await createTestGenerus({ is_active: false });
            
            const result = await generateIDCardPDF(generus.id);

            expect(result.success).toBe(false);
            expect(result.pdfUrl).toBeUndefined();
            expect(result.message).toBe('Cannot generate PDF for inactive generus');
        });
    });

    describe('getIDCardTemplate', () => {
        it('should return template settings', async () => {
            const template = await getIDCardTemplate();

            expect(template.header_text).toBe('Aplikasi Kehadiran Generus - Generasi Penerus Jama\'ah');
            expect(template.footer_text).toBe('Desa Situbondo Barat (de Sind\'rat) - Tahun 2025');
            expect(template.logo_url).toBe('/assets/logo.png');
            expect(template.background_color).toBe('#1e40af');
            expect(template.text_color).toBe('#ffffff');
        });
    });

    describe('updateIDCardTemplate', () => {
        it('should update template with valid colors', async () => {
            const updates = {
                header_text: 'New Header',
                background_color: '#ff0000',
                text_color: '#000000'
            };

            const result = await updateIDCardTemplate(updates);

            expect(result.success).toBe(true);
            expect(result.message).toBe('ID card template updated successfully');
        });

        it('should fail with invalid background color', async () => {
            const updates = { background_color: 'invalid-color' };

            const result = await updateIDCardTemplate(updates);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid background color format. Use hex format (#RRGGBB)');
        });

        it('should fail with invalid text color', async () => {
            const updates = { text_color: '#gggggg' };

            const result = await updateIDCardTemplate(updates);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid text color format. Use hex format (#RRGGBB)');
        });
    });

    describe('validateIDCard', () => {
        it('should validate card by barcode', async () => {
            const generus = await createTestGenerus({ barcode: 'GEN123456' });
            
            const result = await validateIDCard('GEN123456');

            expect(result.valid).toBe(true);
            expect(result.generus!.id).toBe(generus.id);
            expect(result.message).toBe('ID card is valid');
        });

        it('should validate card by ID', async () => {
            const generus = await createTestGenerus();
            
            const result = await validateIDCard(generus.id.toString());

            expect(result.valid).toBe(true);
            expect(result.generus!.id).toBe(generus.id);
            expect(result.message).toBe('ID card is valid');
        });

        it('should validate card by QR code data', async () => {
            const generus = await createTestGenerus({ barcode: 'GEN123456' });
            const qrData = JSON.stringify({
                id: generus.id,
                barcode: 'GEN123456',
                name: 'Test Generus'
            });
            
            const result = await validateIDCard(qrData);

            expect(result.valid).toBe(true);
            expect(result.generus!.id).toBe(generus.id);
            expect(result.message).toBe('ID card is valid');
        });

        it('should fail for inactive generus', async () => {
            const generus = await createTestGenerus({ 
                barcode: 'GEN123456', 
                is_active: false 
            });
            
            const result = await validateIDCard('GEN123456');

            expect(result.valid).toBe(false);
            expect(result.generus!.id).toBe(generus.id);
            expect(result.message).toBe('ID card belongs to inactive generus');
        });

        it('should fail for non-existent card', async () => {
            const result = await validateIDCard('GEN999999');

            expect(result.valid).toBe(false);
            expect(result.generus).toBeUndefined();
            expect(result.message).toBe('ID card not found in system');
        });

        it('should fail for invalid card data format', async () => {
            const result = await validateIDCard('invalid-format');

            expect(result.valid).toBe(false);
            expect(result.generus).toBeUndefined();
            expect(result.message).toBe('Invalid card data format');
        });
    });

    describe('getAllIssuedIDCards', () => {
        it('should return all generus with issued ID cards', async () => {
            const generus1 = await createTestGenerus({ 
                full_name: 'Generus 1', 
                barcode: 'GEN000001' 
            });
            const generus2 = await createTestGenerus({ 
                full_name: 'Generus 2', 
                barcode: 'GEN000002',
                is_active: false 
            });
            // Generus without barcode - should not appear in results
            await createTestGenerus({ full_name: 'Generus 3' });

            const cards = await getAllIssuedIDCards();

            expect(cards).toHaveLength(2);
            expect(cards.find(c => c.generus_id === generus1.id)).toEqual({
                generus_id: generus1.id,
                full_name: 'Generus 1',
                card_number: 'GEN000001',
                issued_date: generus1.updated_at,
                status: 'active'
            });
            expect(cards.find(c => c.generus_id === generus2.id)).toEqual({
                generus_id: generus2.id,
                full_name: 'Generus 2',
                card_number: 'GEN000002',
                issued_date: generus2.updated_at,
                status: 'expired'
            });
        });

        it('should return empty array when no cards issued', async () => {
            // Create generus without barcodes
            await createTestGenerus();
            await createTestGenerus({ full_name: 'Another Generus' });

            const cards = await getAllIssuedIDCards();

            expect(cards).toHaveLength(0);
        });
    });

    describe('bulkGenerateIDCards', () => {
        it('should generate multiple ID cards successfully', async () => {
            const generus1 = await createTestGenerus({ full_name: 'Generus 1' });
            const generus2 = await createTestGenerus({ full_name: 'Generus 2' });

            const result = await bulkGenerateIDCards([generus1.id, generus2.id]);

            expect(result.success).toBe(true);
            expect(result.generated).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.zipUrl).toMatch(/^\/downloads\/id-cards-bulk-\d+\.zip$/);
            expect(result.message).toBe('Successfully generated 2 ID cards');
        });

        it('should handle mixed success and failure', async () => {
            const generus1 = await createTestGenerus({ full_name: 'Active Generus' });
            const generus2 = await createTestGenerus({ 
                full_name: 'Inactive Generus',
                is_active: false 
            });

            const result = await bulkGenerateIDCards([generus1.id, generus2.id]);

            expect(result.success).toBe(true);
            expect(result.generated).toBe(1);
            expect(result.failed).toBe(1);
            expect(result.message).toBe('Successfully generated 1 ID cards, 1 failed');
        });

        it('should fail with empty ID array', async () => {
            const result = await bulkGenerateIDCards([]);

            expect(result.success).toBe(false);
            expect(result.generated).toBe(0);
            expect(result.failed).toBe(0);
            expect(result.message).toBe('No generus IDs provided');
        });

        it('should fail when all generations fail', async () => {
            const result = await bulkGenerateIDCards([99999, 99998]);

            expect(result.success).toBe(false);
            expect(result.generated).toBe(0);
            expect(result.failed).toBe(2);
            expect(result.message).toBe('Failed to generate any ID cards');
        });
    });
});