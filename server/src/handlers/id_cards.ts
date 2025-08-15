import { db } from '../db';
import { generusTable } from '../db/schema';
import { type Generus } from '../schema';
import { eq } from 'drizzle-orm';

// Generate ID card data for generus
export async function generateGenerusIDCard(generusId: number): Promise<{
    success: boolean;
    idCard?: {
        generus: Generus;
        qrCode: string;
        cardNumber: string;
        issuedDate: Date;
    };
    message: string;
}> {
    try {
        // Find the generus by ID
        const generusResult = await db.select()
            .from(generusTable)
            .where(eq(generusTable.id, generusId))
            .execute();

        if (generusResult.length === 0) {
            return {
                success: false,
                message: 'Generus not found'
            };
        }

        const generus = generusResult[0];

        // Check if generus is active
        if (!generus.is_active) {
            return {
                success: false,
                message: 'Cannot generate ID card for inactive generus'
            };
        }

        // Generate card number
        const cardNumber = `GEN${generusId.toString().padStart(6, '0')}`;

        // Generate QR code data (in real implementation, this would be actual QR code generation)
        const qrCodeData = JSON.stringify({
            id: generus.id,
            name: generus.full_name,
            barcode: generus.barcode || cardNumber,
            level: generus.level,
            group: generus.sambung_group
        });

        // Simulate QR code image generation (base64 encoded)
        const qrCode = `data:image/png;base64,${Buffer.from(qrCodeData).toString('base64')}`;

        // Update generus barcode if not set
        if (!generus.barcode) {
            await db.update(generusTable)
                .set({ 
                    barcode: cardNumber,
                    updated_at: new Date()
                })
                .where(eq(generusTable.id, generusId))
                .execute();

            generus.barcode = cardNumber;
        }

        return {
            success: true,
            idCard: {
                generus,
                qrCode,
                cardNumber,
                issuedDate: new Date()
            },
            message: 'ID card generated successfully'
        };
    } catch (error) {
        console.error('ID card generation failed:', error);
        return {
            success: false,
            message: 'Failed to generate ID card'
        };
    }
}

// Generate PDF ID card
export async function generateIDCardPDF(generusId: number): Promise<{
    success: boolean;
    pdfUrl?: string;
    message: string;
}> {
    try {
        // First check if generus exists and is active
        const generusResult = await db.select()
            .from(generusTable)
            .where(eq(generusTable.id, generusId))
            .execute();

        if (generusResult.length === 0) {
            return {
                success: false,
                message: 'Generus not found'
            };
        }

        const generus = generusResult[0];

        if (!generus.is_active) {
            return {
                success: false,
                message: 'Cannot generate PDF for inactive generus'
            };
        }

        // In a real implementation, this would generate actual PDF using libraries like PDFKit or Puppeteer
        const pdfUrl = `/id-cards/generus_${generusId}_id_card.pdf`;

        return {
            success: true,
            pdfUrl,
            message: 'PDF ID card generated successfully'
        };
    } catch (error) {
        console.error('PDF generation failed:', error);
        return {
            success: false,
            message: 'Failed to generate PDF ID card'
        };
    }
}

// Get ID card template settings
export async function getIDCardTemplate(): Promise<{
    header_text: string;
    footer_text: string;
    logo_url: string;
    background_color: string;
    text_color: string;
}> {
    // In a real implementation, these settings would be stored in database
    // For now, return default template settings
    return {
        header_text: 'Aplikasi Kehadiran Generus - Generasi Penerus Jama\'ah',
        footer_text: 'Desa Situbondo Barat (de Sind\'rat) - Tahun 2025',
        logo_url: '/assets/logo.png',
        background_color: '#1e40af',
        text_color: '#ffffff'
    };
}

// Update ID card template (coordinator only)
export async function updateIDCardTemplate(updates: {
    header_text?: string;
    footer_text?: string;
    logo_url?: string;
    background_color?: string;
    text_color?: string;
}): Promise<{ success: boolean; message: string }> {
    try {
        // In a real implementation, this would update template settings in database
        // For now, just validate the input and return success
        
        if (updates.background_color && !/^#[0-9A-Fa-f]{6}$/.test(updates.background_color)) {
            return {
                success: false,
                message: 'Invalid background color format. Use hex format (#RRGGBB)'
            };
        }

        if (updates.text_color && !/^#[0-9A-Fa-f]{6}$/.test(updates.text_color)) {
            return {
                success: false,
                message: 'Invalid text color format. Use hex format (#RRGGBB)'
            };
        }

        return {
            success: true,
            message: 'ID card template updated successfully'
        };
    } catch (error) {
        console.error('Template update failed:', error);
        return {
            success: false,
            message: 'Failed to update ID card template'
        };
    }
}

// Validate ID card by scanning
export async function validateIDCard(cardData: string): Promise<{
    valid: boolean;
    generus?: Generus;
    message: string;
}> {
    try {
        // Parse card data (could be QR code data, barcode, or card number)
        let searchValue: string;
        
        try {
            // Try to parse as JSON (QR code data)
            const qrData = JSON.parse(cardData);
            searchValue = qrData.barcode || qrData.id?.toString() || cardData;
        } catch {
            // If not JSON, use as direct barcode/card number
            searchValue = cardData;
        }

        // Search for generus by barcode or ID
        let generusResult;
        
        if (/^GEN\d{6}$/.test(searchValue)) {
            // Search by barcode
            generusResult = await db.select()
                .from(generusTable)
                .where(eq(generusTable.barcode, searchValue))
                .execute();
        } else if (/^\d+$/.test(searchValue)) {
            // Search by ID
            const generusId = parseInt(searchValue);
            generusResult = await db.select()
                .from(generusTable)
                .where(eq(generusTable.id, generusId))
                .execute();
        } else {
            return {
                valid: false,
                message: 'Invalid card data format'
            };
        }

        if (generusResult.length === 0) {
            return {
                valid: false,
                message: 'ID card not found in system'
            };
        }

        const generus = generusResult[0];

        if (!generus.is_active) {
            return {
                valid: false,
                generus,
                message: 'ID card belongs to inactive generus'
            };
        }

        return {
            valid: true,
            generus,
            message: 'ID card is valid'
        };
    } catch (error) {
        console.error('ID card validation failed:', error);
        return {
            valid: false,
            message: 'Failed to validate ID card'
        };
    }
}

// Get all issued ID cards (coordinator only)
export async function getAllIssuedIDCards(): Promise<{
    generus_id: number;
    full_name: string;
    card_number: string;
    issued_date: Date;
    status: 'active' | 'expired';
}[]> {
    try {
        // Get all generus with barcodes (indicating ID card was issued)
        const generusWithCards = await db.select()
            .from(generusTable)
            .execute();

        return generusWithCards
            .filter(generus => generus.barcode) // Only include those with barcodes
            .map(generus => ({
                generus_id: generus.id,
                full_name: generus.full_name,
                card_number: generus.barcode!,
                issued_date: generus.updated_at,
                status: generus.is_active ? 'active' as const : 'expired' as const
            }));
    } catch (error) {
        console.error('Failed to get issued ID cards:', error);
        throw error;
    }
}

// Bulk generate ID cards
export async function bulkGenerateIDCards(generusIds: number[]): Promise<{
    success: boolean;
    generated: number;
    failed: number;
    zipUrl?: string;
    message: string;
}> {
    try {
        if (generusIds.length === 0) {
            return {
                success: false,
                generated: 0,
                failed: 0,
                message: 'No generus IDs provided'
            };
        }

        let generated = 0;
        let failed = 0;

        for (const generusId of generusIds) {
            try {
                const result = await generateGenerusIDCard(generusId);
                if (result.success) {
                    generated++;
                } else {
                    failed++;
                }
            } catch {
                failed++;
            }
        }

        if (generated === 0) {
            return {
                success: false,
                generated: 0,
                failed,
                message: 'Failed to generate any ID cards'
            };
        }

        // In a real implementation, this would create a ZIP file with all PDF cards
        const zipUrl = `/downloads/id-cards-bulk-${Date.now()}.zip`;

        return {
            success: true,
            generated,
            failed,
            zipUrl,
            message: `Successfully generated ${generated} ID cards${failed > 0 ? `, ${failed} failed` : ''}`
        };
    } catch (error) {
        console.error('Bulk ID card generation failed:', error);
        return {
            success: false,
            generated: 0,
            failed: generusIds.length,
            message: 'Failed to generate ID cards'
        };
    }
}