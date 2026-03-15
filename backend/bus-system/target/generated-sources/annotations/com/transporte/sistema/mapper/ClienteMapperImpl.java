package com.transporte.sistema.mapper;

import com.transporte.sistema.dto.request.ClienteRequest;
import com.transporte.sistema.dto.response.ClienteResponse;
import com.transporte.sistema.entity.Cliente;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-03-15T15:31:55-0500",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.45.0.v20260224-0835, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ClienteMapperImpl implements ClienteMapper {

    @Override
    public Cliente toEntity(ClienteRequest request) {
        if ( request == null ) {
            return null;
        }

        Cliente.ClienteBuilder<?, ?> cliente = Cliente.builder();

        cliente.apellidos( request.getApellidos() );
        cliente.ciudad( request.getCiudad() );
        cliente.direccion( request.getDireccion() );
        cliente.distrito( request.getDistrito() );
        cliente.dniRuc( request.getDniRuc() );
        cliente.email( request.getEmail() );
        cliente.nombres( request.getNombres() );
        cliente.razonSocial( request.getRazonSocial() );
        cliente.telefono( request.getTelefono() );
        cliente.tipoCliente( request.getTipoCliente() );

        return cliente.build();
    }

    @Override
    public ClienteResponse toResponse(Cliente cliente) {
        if ( cliente == null ) {
            return null;
        }

        ClienteResponse.ClienteResponseBuilder clienteResponse = ClienteResponse.builder();

        clienteResponse.apellidos( cliente.getApellidos() );
        clienteResponse.ciudad( cliente.getCiudad() );
        clienteResponse.createdAt( cliente.getCreatedAt() );
        clienteResponse.direccion( cliente.getDireccion() );
        clienteResponse.distrito( cliente.getDistrito() );
        clienteResponse.dniRuc( cliente.getDniRuc() );
        clienteResponse.email( cliente.getEmail() );
        clienteResponse.id( cliente.getId() );
        clienteResponse.nombres( cliente.getNombres() );
        clienteResponse.razonSocial( cliente.getRazonSocial() );
        clienteResponse.telefono( cliente.getTelefono() );
        clienteResponse.tipoCliente( cliente.getTipoCliente() );

        clienteResponse.nombreCompleto( cliente.getNombreCompleto() );

        return clienteResponse.build();
    }

    @Override
    public void updateEntityFromRequest(ClienteRequest request, Cliente cliente) {
        if ( request == null ) {
            return;
        }

        cliente.setApellidos( request.getApellidos() );
        cliente.setCiudad( request.getCiudad() );
        cliente.setDireccion( request.getDireccion() );
        cliente.setDistrito( request.getDistrito() );
        cliente.setDniRuc( request.getDniRuc() );
        cliente.setEmail( request.getEmail() );
        cliente.setNombres( request.getNombres() );
        cliente.setRazonSocial( request.getRazonSocial() );
        cliente.setTelefono( request.getTelefono() );
        cliente.setTipoCliente( request.getTipoCliente() );
    }
}
