import { serviceRepository } from "@/features/service/server/service.repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) { 
    try{
        // await requireRole(['ADMIN', 'MANAGER'])
        const awaitedParams = await params;
        const serviceId = awaitedParams.id;

        if(!serviceId){
            return NextResponse.json({
                success: false,
                message: "Service ID is required"
            })
        }

        const service = await serviceRepository.findById(serviceId);

        return NextResponse.json({
            success: true,
            data: service
        }, { status: 200 })

    }catch (error) {
        console.error('Error: getting service', error);
        if (error instanceof NextResponse) return error
        return NextResponse.json({
            success: false,
            message: 'Failed to get service',
        }, { status: 500 });
    }

}



export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // await requireRole(['ADMIN', 'MANAGER'])
    const awaitedParams = await params;
    const serviceId = awaitedParams.id;

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        message: "Service ID is required"
      })
    }

    const deletedService = await serviceRepository.deleteById(serviceId);

    return NextResponse.json({
      success: true,
      message: deletedService.name + " Service deleted successfully"
    }, { status: 200 })

  } catch (error) {
    console.error('Service delete error:', error);
    if (error instanceof NextResponse) return error
    return NextResponse.json({
      success: false,
      message: 'Failed to delete Service',
    }, { status: 500 });
  }

}